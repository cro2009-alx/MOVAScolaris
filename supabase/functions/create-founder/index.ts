import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return Response.json({ error: "Méthode non autorisée." }, { status: 405, headers });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return Response.json({ error: "Configuration serveur incomplète." }, { status: 500, headers });

  let body: { school_name?: string; full_name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400, headers });
  }
  const schoolName = body.school_name?.trim();
  const fullName = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!schoolName || !fullName || !email || !password || password.length < 8) {
    return Response.json({ error: "École, nom, e-mail et mot de passe de 8 caractères minimum requis." }, { status: 400, headers });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { school_name: schoolName, full_name: fullName },
  });
  if (createError || !created.user) {
    return Response.json({ error: createError?.message ?? "Création du fondateur impossible." }, { status: 400, headers });
  }

  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: session, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || !session.session) {
    return Response.json({ error: signInError?.message ?? "Compte créé, mais connexion automatique impossible." }, { status: 500, headers });
  }
  return Response.json({
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: { id: created.user.id, email },
  }, { headers });
});