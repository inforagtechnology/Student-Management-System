// Supabase Edge Function: create-user
//
// Lets a logged-in admin create an HR or Student account.
// Runs server-side only, because it uses the SERVICE ROLE key —
// that key must never be shipped to the browser.
//
// Deploy with:
//   supabase functions deploy create-user
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to the caller's own token, used only to verify
    // "is this person actually an admin".
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return json({ error: "Not authenticated." }, 401);
    }

    const { data: callerProfile, error: profileErr } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileErr || callerProfile?.role !== "admin") {
      return json({ error: "Only an admin can create accounts." }, 403);
    }

    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !role) {
      return json({ error: "email, password and role are required." }, 400);
    }
    if (!["hr", "student"].includes(role)) {
      return json({ error: "role must be 'hr' or 'student'." }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Password must be at least 8 characters." }, 400);
    }

    // Admin-vouched accounts are created already confirmed —
    // they skip the email-verification step self-signups go through.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createErr) {
      return json({ error: createErr.message }, 400);
    }

    // The DB trigger inserts the profile row with the role from
    // user_metadata already, but we set it explicitly too in case
    // the trigger ever changes — cheap safety net.
    await adminClient
      .from("profiles")
      .update({ role, full_name })
      .eq("id", created.user.id);

    return json({ ok: true, user_id: created.user.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
