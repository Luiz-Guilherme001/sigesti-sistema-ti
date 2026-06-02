import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const user_id = body.user_id;

    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRole!
    );

    console.log("SERVICE ROLE EXISTS:", !!serviceRole);
    console.log("USER ID:", user_id);

    // DELETE AUTH USER
    const result = await admin.auth.admin.deleteUser(user_id);

    console.log("DELETE RESULT:", JSON.stringify(result, null, 2));

    // DELETE TABLE DATA
    if (
  !result.error ||
  result.error.code === "user_not_found"
) {

  const profileDelete = await admin
    .from("profiles")
    .delete()
    .eq("user_id", user_id);

  console.log(
    "PROFILE DELETE:",
    JSON.stringify(profileDelete, null, 2)
  );

  const roleDelete = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", user_id);

  console.log(
    "ROLE DELETE:",
    JSON.stringify(roleDelete, null, 2)
  );

  const logsDelete = await admin
    .from("access_logs")
    .delete()
    .eq("user_id", user_id);

  console.log(
    "LOGS DELETE:",
    JSON.stringify(logsDelete, null, 2)
  );
}

    return new Response(
      JSON.stringify({
        success: !result.error,
        error: result.error,
        data: result.data,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.log("ERRO GERAL:", e);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(e),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});