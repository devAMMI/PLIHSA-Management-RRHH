import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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
      .select("role, is_active")
      .eq("user_id", requestUser.id)
      .maybeSingle();

    if (systemUserError || !systemUser || !systemUser.is_active || systemUser.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Solo superadmin puede ejecutar SQL directo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { sql, action, userId, newPassword } = body;

    if (action === "reset_password" && userId && newPassword) {
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "La contrasena debe tener al menos 6 caracteres" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (authError) {
        return new Response(JSON.stringify({ error: "Error al cambiar contrasena: " + authError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, message: "Contrasena actualizada correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user" && userId) {
      const { error: deleteSystemError } = await supabaseAdmin
        .from("system_users")
        .delete()
        .eq("user_id", userId);
      if (deleteSystemError) {
        return new Response(JSON.stringify({ error: "Error eliminando system_user: " + deleteSystemError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        return new Response(JSON.stringify({ error: "Error eliminando auth user: " + authDeleteError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, message: "Usuario eliminado correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_auth_users") {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const users = (authUsers?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
      }));
      return new Response(JSON.stringify({ data: users, rowCount: users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sql) {
      return new Response(JSON.stringify({ error: "Se requiere el campo 'sql'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forbiddenPatterns = [
      /drop\s+table/i,
      /drop\s+database/i,
      /drop\s+schema/i,
      /truncate\s+/i,
      /alter\s+table.*drop/i,
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sql)) {
        return new Response(JSON.stringify({ error: "Operacion no permitida por seguridad (DROP/TRUNCATE)" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error: sqlError } = await supabaseAdmin.rpc("execute_raw_sql", { query_text: sql });

    if (sqlError) {
      const { data: directData, error: directError } = await supabaseAdmin
        .from("system_users")
        .select("*")
        .limit(0);

      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("SELECT")) {
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          const { data: tableData, error: tableError } = await supabaseAdmin
            .from(tableName)
            .select("*");
          if (tableError) {
            return new Response(JSON.stringify({ error: tableError.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ data: tableData, rowCount: tableData?.length || 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ error: sqlError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = Array.isArray(data) ? data : (data ? [data] : []);
    return new Response(JSON.stringify({ data: rows, rowCount: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in execute-sql:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
