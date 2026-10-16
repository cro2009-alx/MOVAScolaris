import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Domaine interne : sert uniquement à fabriquer l'e-mail technique exigé par Supabase Auth.
// Il ne reçoit jamais de vrais e-mails. Doit rester identique à SECRETARY_DOMAIN dans index.tsx.
const SECRETARY_DOMAIN = "secretaires.scolaris.app";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Méthode non autorisée." }, { status: 405, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json({ error: "Authentification requise." }, { status: 401, headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return Response.json({ error: "Configuration serveur incomplète." }, { status: 500, headers: corsHeaders });
  }

  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return Response.json({ error: "Session invalide." }, { status: 401, headers: corsHeaders });
  }

  const { data: role } = await callerClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerData.user.id)
    .maybeSingle();
  if (role?.role !== "founder") {
    return Response.json({ error: "Seul le fondateur peut gérer l’équipe." }, { status: 403, headers: corsHeaders });
  }

  const { data: profile } = await callerClient
    .from("profiles")
    .select("school_id")
    .eq("id", callerData.user.id)
    .single();
  if (!profile) {
    return Response.json({ error: "Établissement introuvable." }, { status: 403, headers: corsHeaders });
  }

  let body: { action?: string; full_name?: string; username?: string; temporary_password?: string; new_password?: string; session_period?: string; secretary_id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400, headers: corsHeaders });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (body.action === "delete") {
    if (!body.secretary_id) return Response.json({ error: "Identifiant secrétaire requis." }, { status: 400, headers: corsHeaders });
    const { data: deleted, error: purgeError } = await callerClient.rpc("delete_secretary_access", { _user_id: body.secretary_id });
    if (purgeError) return Response.json({ error: purgeError.message }, { status: 403, headers: corsHeaders });
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(body.secretary_id);
    if (authDeleteError) return Response.json({ error: `Données supprimées, suppression Auth à reprendre : ${authDeleteError.message}` }, { status: 500, headers: corsHeaders });
    return Response.json({ deleted: true, id: body.secretary_id, email: deleted?.email }, { headers: corsHeaders });
  }

  if (body.action === "update_period") {
    const sessionPeriod = body.session_period?.trim();
    if (!body.secretary_id || !sessionPeriod) return Response.json({ error: "Secrétaire et période obligatoires." }, { status: 400, headers: corsHeaders });
    const { data: target } = await admin.from("profiles").select("id, school_id, full_name").eq("id", body.secretary_id).eq("school_id", profile.school_id).single();
    const { data: targetRole } = await admin.from("user_roles").select("role").eq("user_id", body.secretary_id).maybeSingle();
    if (!target || targetRole?.role !== "secretary") return Response.json({ error: "Secrétaire introuvable dans cet établissement." }, { status: 404, headers: corsHeaders });
    const { error } = await admin.from("profiles").update({ session_period: sessionPeriod }).eq("id", body.secretary_id).eq("school_id", profile.school_id);
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    await admin.from("activity_log").insert({ school_id: profile.school_id, action: "Période secrétaire modifiée", details: { profile_id: target.id, full_name: target.full_name, session_period: sessionPeriod }, author_id: callerData.user.id });
    return Response.json({ id: target.id, session_period: sessionPeriod }, { headers: corsHeaders });
  }

  if (body.action === "reset_password") {
    const newPassword = body.new_password;
    if (!body.secretary_id || !newPassword || newPassword.length < 8) {
      return Response.json({ error: "Secrétaire et nouveau mot de passe de 8 caractères minimum requis." }, { status: 400, headers: corsHeaders });
    }
    const { data: target } = await admin.from("profiles").select("id, school_id, full_name").eq("id", body.secretary_id).eq("school_id", profile.school_id).single();
    const { data: targetRole } = await admin.from("user_roles").select("role").eq("user_id", body.secretary_id).maybeSingle();
    if (!target || targetRole?.role !== "secretary") return Response.json({ error: "Secrétaire introuvable dans cet établissement." }, { status: 404, headers: corsHeaders });
    const { error } = await admin.auth.admin.updateUserById(body.secretary_id, { password: newPassword });
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    await admin.from("activity_log").insert({ school_id: profile.school_id, action: "Mot de passe secrétaire réinitialisé", details: { profile_id: target.id, full_name: target.full_name }, author_id: callerData.user.id });
    return Response.json({ id: target.id }, { headers: corsHeaders });
  }

  const fullName = body.full_name?.trim();
  const username = body.username?.trim().toLowerCase();
  const password = body.temporary_password;
  const sessionPeriod = body.session_period?.trim();
  if (!fullName || !username || !password || password.length < 8 || !sessionPeriod) {
    return Response.json({ error: "Nom, identifiant, période et mot de passe de 8 caractères minimum requis." }, { status: 400, headers: corsHeaders });
  }
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    return Response.json({ error: "Identifiant invalide : 3 à 30 caractères (lettres minuscules, chiffres, point, tiret ou tiret bas), sans espace ni @." }, { status: 400, headers: corsHeaders });
  }
  const email = `${username}@${SECRETARY_DOMAIN}`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const alreadyUsed = /already|registered|exists/i.test(createError?.message ?? "");
    return Response.json(
      { error: alreadyUsed ? "Cet identifiant est déjà utilisé. Choisissez-en un autre." : (createError?.message ?? "Création du compte impossible.") },
      { status: 400, headers: corsHeaders },
    );
  }

  const { data: lastStructure } = await admin
    .from("profiles")
    .select("structure_number")
    .eq("school_id", profile.school_id)
    .not("structure_number", "is", null)
    .order("structure_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: deletedStructures } = await admin
    .from("activity_log")
    .select("details")
    .eq("school_id", profile.school_id)
    .eq("action", "Accès supprimé");
  const historicalMax = (deletedStructures ?? []).reduce((max, row) => {
    const value = Number((row.details as Record<string, unknown>)?.structure_number ?? 0);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  const structureNumber = Math.max(lastStructure?.structure_number ?? 0, historicalMax) + 1;

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    school_id: profile.school_id,
    full_name: fullName,
    email,
    session_period: sessionPeriod,
    structure_number: structureNumber,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: profileError.message }, { status: 400, headers: corsHeaders });
  }

  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: created.user.id,
    role: "secretary",
  });
  if (roleError) {
    await admin.from("profiles").delete().eq("id", created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: roleError.message }, { status: 400, headers: corsHeaders });
  }

  await admin.from("activity_log").insert({
    school_id: profile.school_id,
    action: "Membre ajouté",
    details: { profile_id: created.user.id, full_name: fullName, role: "secretary", session_period: sessionPeriod, structure_number: structureNumber },
    author_id: callerData.user.id,
  });

  return Response.json({ id: created.user.id, full_name: fullName, username, email, structure_number: structureNumber }, { headers: corsHeaders });
});