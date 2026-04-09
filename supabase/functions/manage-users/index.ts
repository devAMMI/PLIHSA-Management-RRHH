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
      .select("role, is_active, company_id")
      .eq("user_id", requestUser.id)
      .maybeSingle();

    if (systemUserError || !systemUser) {
      return new Response(JSON.stringify({ error: "User not found in system" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_MANAGER_ROLES = ["superadmin", "admin", "rrhh"];
    if (!systemUser.is_active || !ALLOWED_MANAGER_ROLES.includes(systemUser.role)) {
      return new Response(JSON.stringify({ error: "No tienes permisos para gestionar usuarios" }), {
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
        console.error("Error listing system_users:", listError);
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
        return new Response(JSON.stringify({ error: "userId and newPassword required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
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

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE" || body.action === "delete_user") {
      const userId = body.userId || url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
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

      if (deleteSystemError) throw deleteSystemError;

      await supabaseAdmin.auth.admin.deleteUser(userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
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
