import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const usersToFix = [
      { id: "3c5c4802-996d-414b-9b84-80d01b12b8c3", email: "rmoya@ammi.com", full_name: "Roberto Moya" },
      { id: "0d2927d9-fb31-495c-8388-f63a30d530da", email: "alvaro.rivera@plihsa.com", full_name: "Alvaro Rivera" },
    ];

    const results = [];

    for (const u of usersToFix) {
      const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(u.id);

      if (!getErr && existing?.user) {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
          password: "Temporal2026",
          email_confirm: true,
        });
        results.push({ email: u.email, action: "updated", success: !updateErr, error: updateErr?.message });
      } else {
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(u.id).catch(() => ({ error: null })) as any;

        try {
          await supabaseAdmin.rpc('exec_sql', {
            sql: `DELETE FROM auth.users WHERE id = '${u.id}'`
          });
        } catch (_) {}

        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: "Temporal2026",
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });

        if (createErr) {
          results.push({ email: u.email, action: "create_failed", success: false, error: createErr.message });
          continue;
        }

        const newId = created.user?.id;
        if (newId && newId !== u.id) {
          await supabaseAdmin
            .from("system_users")
            .update({ user_id: newId })
            .eq("user_id", u.id);
        }

        results.push({ email: u.email, action: "recreated", success: true, old_id: u.id, new_id: newId });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
