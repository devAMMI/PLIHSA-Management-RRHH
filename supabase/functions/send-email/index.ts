import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey" };
const allowedRoles = ['superadmin', 'admin', 'manager', 'jefe'];

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'No autorizado' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: authError } = await client.auth.getUser(authorization.replace('Bearer ', ''));
    if (authError || !user) return json({ error: 'Sesión no válida' }, 401);
    const { data: systemUser } = await client.from('system_users').select('role, is_active').eq('user_id', user.id).maybeSingle();
    if (!systemUser?.is_active || !allowedRoles.includes(systemUser.role)) return json({ error: 'No tienes permiso para enviar definiciones por correo' }, 403);

    const body = await req.json();
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const html = typeof body.body === 'string' ? body.body : '';
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!to || !subject || !html || attachments.length === 0) return json({ error: 'El destinatario, contenido y PDF son obligatorios' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: 'El correo del destinatario no es válido' }, 400);
    const allowedAttachmentTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (attachments.some((item: any) => !allowedAttachmentTypes.includes(item.contentType) || !item.filename || !item.content)) return json({ error: 'El archivo adjunto no es válido' }, 400);

    const tenant = Deno.env.get('AZURE_TENANT_ID');
    const clientId = Deno.env.get('AZURE_CLIENT_ID');
    const secret = Deno.env.get('AZURE_CLIENT_SECRET');
    const from = Deno.env.get('MAIL_FROM');
    if (!tenant || !clientId || !secret || !from) return json({ error: 'El servicio de correo no está configurado' }, 500);
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }) });
    if (!tokenResponse.ok) throw new Error(`Azure token error (${tokenResponse.status})`);
    const { access_token: accessToken } = await tokenResponse.json();
    const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${from}/sendMail`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { subject, body: { contentType: 'HTML', content: html }, toRecipients: [{ emailAddress: { address: to } }], attachments: attachments.map((item: any) => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: item.filename, contentType: item.contentType, contentBytes: item.content })) }, saveToSentItems: true }) });
    if (!graphResponse.ok) throw new Error(`Graph sendMail error (${graphResponse.status})`);
    return json({ success: true, message: `Correo enviado a ${to}` });
  } catch (error: any) {
    console.error('Error en send-email:', error);
    return json({ error: error.message || 'Error interno del servidor' }, 500);
  }
});
