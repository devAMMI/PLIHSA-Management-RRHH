import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error: missing env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !requestUser) {
      return new Response(JSON.stringify({ error: "Invalid or expired token: " + (userError?.message ?? "no user") }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: systemUser, error: systemUserError } = await supabaseAdmin
      .from("system_users")
      .select("role, is_active, company_id")
      .eq("user_id", requestUser.id)
      .maybeSingle();

    if (systemUserError) {
      return new Response(JSON.stringify({ error: "DB error finding system user: " + systemUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!systemUser) {
      return new Response(JSON.stringify({ error: "User not found in system_users. uid=" + requestUser.id }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_MANAGER_ROLES = ["superadmin", "admin", "rrhh"];
    if (!systemUser.is_active || !ALLOWED_MANAGER_ROLES.includes(systemUser.role)) {
      return new Response(JSON.stringify({ error: "Sin permisos. Role=" + systemUser.role + " active=" + systemUser.is_active }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterLevel = ROLE_HIERARCHY[systemUser.role] ?? 0;
    const isSuperAdmin = systemUser.role === "superadmin";

    const url = new URL(req.url);

    if (req.method === "GET" && url.searchParams.get("action") === "list") {
      const { data: systemUsers, error: listError } = await supabaseAdmin
        .from("system_users")
        .select(`
          *,
          employee:employees(first_name, last_name, photo_url),
          company:companies(name)
        `)
        .order("created_at", { ascending: false });

      if (listError) {
        return new Response(JSON.stringify({ error: "Database error finding users: " + listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const users = (systemUsers || []).filter((u: any) => {
        if (isSuperAdmin) return true;
        if (u.user_id === requestUser.id) return true;
        const targetLevel = ROLE_HIERARCHY[u.role] ?? 0;
        return targetLevel <= requesterLevel;
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));

    if (req.method === "POST" && body.action === "reset_password") {
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ error: "userId and newPassword son requeridos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "La contrasena debe tener al menos 6 caracteres" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId !== requestUser.id) {
        const { data: targetUser } = await supabaseAdmin
          .from("system_users")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const targetLevel = ROLE_HIERARCHY[targetUser?.role ?? ""] ?? 0;
        if (!isSuperAdmin && targetLevel > requesterLevel) {
          return new Response(JSON.stringify({ error: "No tienes permiso para cambiar la contrasena de este usuario" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (authError) {
        console.error("Auth admin updateUserById error:", authError);
        return new Response(JSON.stringify({ error: "Error al cambiar contrasena: " + authError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Contrasena actualizada correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && (body.action === "delete_user")) {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId requerido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId === requestUser.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetUser } = await supabaseAdmin
        .from("system_users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const targetLevel = ROLE_HIERARCHY[targetUser?.role ?? ""] ?? 0;
      if (!isSuperAdmin && targetLevel > requesterLevel) {
        return new Response(JSON.stringify({ error: "No tienes permiso para eliminar este usuario" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteSystemError } = await supabaseAdmin
        .from("system_users")
        .delete()
        .eq("user_id", userId);

      if (deleteSystemError) {
        return new Response(JSON.stringify({ error: "Error eliminando de system_users: " + deleteSystemError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error("Auth admin deleteUser error:", authDeleteError);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Accion desconocida. method=" + req.method + " action=" + (body?.action ?? "none") }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in manage-users:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
