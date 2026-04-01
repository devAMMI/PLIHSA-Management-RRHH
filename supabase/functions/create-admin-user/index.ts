import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  email: string;
  password: string;
  companyId: string;
  employeeId?: string | null;
  role: string;
  isActive: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Crear cliente de Supabase con service role key para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar el token del usuario que hace la petición
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verificar que el usuario tiene permisos (admin o superadmin)
    const { data: systemUser, error: systemUserError } = await supabaseAdmin
      .from("system_users")
      .select("role, is_active")
      .eq("user_id", requestUser.id)
      .single();

    if (systemUserError || !systemUser) {
      return new Response(
        JSON.stringify({ error: "User not found in system" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!systemUser.is_active || !["admin", "superadmin"].includes(systemUser.role)) {
      return new Response(
        JSON.stringify({ error: "User not allowed" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Obtener datos de la petición
    const { email, password, companyId, employeeId, role, isActive }: CreateUserRequest = await req.json();

    // Validaciones
    if (!email || !password || !companyId || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Crear usuario en auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Crear registro en system_users
    const { error: userInsertError } = await supabaseAdmin
      .from("system_users")
      .insert({
        user_id: authData.user.id,
        employee_id: employeeId || null,
        company_id: companyId,
        role: role,
        is_active: isActive,
      });

    if (userInsertError) {
      // Si falla la creación en system_users, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw userInsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuario creado exitosamente",
        userId: authData.user.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error al crear el usuario",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
