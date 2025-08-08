import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://tlxhfuizdrkqrcwejfif.supabase.co";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { headers: { "content-type": "application/json", ...corsHeaders }, status: 500 }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const email = "admin@gmail.com";
    const password = "hello123";

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
          headers: { "content-type": "application/json", ...corsHeaders },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        headers: { "content-type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ ok: true, user: data.user }), {
      headers: { "content-type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { "content-type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
