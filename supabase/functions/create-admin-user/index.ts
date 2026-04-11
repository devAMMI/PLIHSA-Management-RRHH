import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 6,
  admin: 5,
  rrhh: 4,
  manager: 3,
  jefe: 3,
  employee: 2,
  viewer: 1,
};

interface CreateUserRequest {
  email: string;
  password: string;
  companyId: string;
  employeeId?: string | null;
  accessibleCompanyIds?: string[] | null;
  role: string;
  isActive: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: systemUser, error: systemUserError } = await supabaseAdmin
      .from("system_users")
      .select("role, is_active")
      .eq("user_id", requestUser.id)
      .maybeSingle();

    if (systemUserError || !systemUser) {
      return new Response(JSON.stringify({ error: "User not found in system" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_CREATOR_ROLES = ["superadmin", "admin", "rrhh"];
    if (!systemUser.is_active || !ALLOWED_CREATOR_ROLES.includes(systemUser.role)) {
      return new Response(JSON.stringify({ error: "No tienes permisos para crear usuarios" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterLevel = ROLE_HIERARCHY[systemUser.role] ?? 0;
    const isSuperAdmin = systemUser.role === "superadmin";

    const { email, password, companyId, employeeId, accessibleCompanyIds, role, isActive }: CreateUserRequest = await req.json();

    if (!email || !password || !companyId || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetLevel = ROLE_HIERARCHY[role] ?? 0;
    if (!isSuperAdmin && targetLevel > requesterLevel) {
      return new Response(JSON.stringify({ error: "No puedes crear un usuario con un rol superior al tuyo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    const { error: userInsertError } = await supabaseAdmin
      .from("system_users")
      .insert({
        user_id: authData.user.id,
        email: email,
        employee_id: employeeId || null,
        company_id: companyId,
        accessible_company_ids: accessibleCompanyIds || null,
        role: role,
        is_active: isActive,
      });

    if (userInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userInsertError;
    }

    return new Response(JSON.stringify({ success: true, message: "Usuario creado exitosamente", userId: authData.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: error.message || "Error al crear el usuario" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
