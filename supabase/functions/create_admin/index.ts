// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://tlxhfuizdrkqrcwejfif.supabase.co";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Desired admin credentials
  const email = "admin@gmail.com";
  const password = "hello123";

  // Try to create the user; if already exists, treat as success
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", seed: true },
  } as any);

  if (error) {
    const already = String(error.message || "").toLowerCase().includes("already registered");
    if (already) {
      return new Response(JSON.stringify({ ok: true, message: "Admin already exists" }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { "content-type": "application/json" },
      status: 400,
    });
  }

  return new Response(JSON.stringify({ ok: true, user: data.user }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
});
