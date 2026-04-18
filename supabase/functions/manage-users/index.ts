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
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
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
      return new Response(JSON.stringify({ error: "Token invalido: " + (userError?.message ?? "usuario no encontrado") }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: systemUser, error: systemUserError } = await supabaseAdmin
      .from("system_users")
      .select("id, role, is_active, company_id")
      .eq("user_id", requestUser.id)
      .maybeSingle();

    if (systemUserError) {
      return new Response(JSON.stringify({ error: "Error DB buscando usuario: " + systemUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!systemUser) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado en system_users (uid=" + requestUser.id + ")" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_ROLES = ["superadmin", "admin", "rrhh"];
    if (!systemUser.is_active || !ALLOWED_ROLES.includes(systemUser.role)) {
      return new Response(JSON.stringify({ error: "Sin permisos para gestionar usuarios. Rol actual: " + systemUser.role }), {
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
        return new Response(JSON.stringify({ error: "Error listando usuarios: " + listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const users = (systemUsers || []).filter((u: any) => {
        if (isSuperAdmin) return true;
        if (u.user_id === requestUser.id) return true;
        return (ROLE_HIERARCHY[u.role] ?? 0) <= requesterLevel;
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "reset_password") {
      const { userId, newPassword } = body;

      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ error: "userId y newPassword son requeridos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (String(newPassword).length < 6) {
        return new Response(JSON.stringify({ error: "La contrasena debe tener al menos 6 caracteres" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId !== requestUser.id) {
        const { data: targetSysUser } = await supabaseAdmin
          .from("system_users")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        const targetLevel = ROLE_HIERARCHY[targetSysUser?.role ?? ""] ?? 0;
        if (!isSuperAdmin && targetLevel >= requesterLevel) {
          return new Response(JSON.stringify({ error: "Sin permiso para cambiar contrasena de este usuario" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: String(newPassword),
      });

      if (authError) {
        return new Response(JSON.stringify({ error: "Error Supabase Auth: " + authError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Contrasena actualizada correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_user") {
      const { systemUserId, updates } = body;

      if (!systemUserId || !updates) {
        return new Response(JSON.stringify({ error: "systemUserId y updates son requeridos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetSysUser } = await supabaseAdmin
        .from("system_users")
        .select("role, user_id")
        .eq("id", systemUserId)
        .maybeSingle();

      if (targetSysUser && targetSysUser.user_id !== requestUser.id) {
        const targetLevel = ROLE_HIERARCHY[targetSysUser?.role ?? ""] ?? 0;
        if (!isSuperAdmin && targetLevel >= requesterLevel) {
          return new Response(JSON.stringify({ error: "Sin permiso para editar este usuario" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.employee_id !== undefined) updateData.employee_id = updates.employee_id;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.company_id !== undefined) updateData.company_id = updates.company_id;
      if (updates.accessible_company_ids !== undefined) updateData.accessible_company_ids = updates.accessible_company_ids;
      if (updates.email !== undefined) updateData.email = updates.email;

      const { error: updateError } = await supabaseAdmin
        .from("system_users")
        .update(updateData)
        .eq("id", systemUserId);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Error actualizando usuario: " + updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Usuario actualizado correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
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

      const { data: targetSysUser } = await supabaseAdmin
        .from("system_users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const targetLevel = ROLE_HIERARCHY[targetSysUser?.role ?? ""] ?? 0;
      if (!isSuperAdmin && targetLevel >= requesterLevel) {
        return new Response(JSON.stringify({ error: "Sin permiso para eliminar este usuario" }), {
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
        console.error("Error eliminando auth user (ignorado):", authDeleteError.message);
      }

      return new Response(JSON.stringify({ success: true, message: "Usuario eliminado correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Accion no reconocida: " + (action ?? "ninguna") }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Unhandled error in manage-users:", error);
    return new Response(JSON.stringify({ error: error.message || "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
