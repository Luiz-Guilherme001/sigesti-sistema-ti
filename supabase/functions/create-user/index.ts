import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let nome: string, email: string, password: string, role: string, setor_id: string | null;
  try {
    const body = await req.json();
    console.log("Body recebido:", JSON.stringify(body));
    nome = body.nome;
    email = body.email;
    password = body.password;
    role = body.role;
    setor_id = body.setor_id ?? null;
  } catch (e) {
    console.error("Erro ao parsear body:", e);
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400, headers: corsHeaders,
    });
  }

  if (!email || !password || !role) {
    return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
      status: 400, headers: corsHeaders,
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  });

  console.log("createUser error:", JSON.stringify(error));
  console.log("createUser data:", data?.user?.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), {
    status: 400, headers: corsHeaders,
  });

  await admin.from("profiles").insert({
    user_id: data.user.id,
    nome,
    email,
    role,
    setor_id,
  });

  await admin.from("user_roles").insert({
    user_id: data.user.id,
    role,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});