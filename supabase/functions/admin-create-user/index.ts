import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "tecnico" | "usuario";

interface Body {
  nome: string;
  email: string;
  password: string;
  role: Role;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Não autenticado" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sessão inválida" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!isAdmin) return json({ error: "Apenas administradores podem criar usuários" }, 403);

    const body = (await req.json()) as Body;
    const nome = (body.nome ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const role: Role = (body.role ?? "usuario") as Role;

    if (!nome || nome.length > 120) return json({ error: "Nome inválido" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "E-mail inválido" }, 400);
    if (password.length < 6) return json({ error: "Senha deve ter ao menos 6 caracteres" }, 400);
    if (!["admin", "tecnico", "usuario"].includes(role))
      return json({ error: "Papel inválido" }, 400);

    // Create auth user (email NOT auto-confirmed → user must verify email)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { nome },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
    }

    const newUserId = created.user.id;

    // Trigger handle_new_user creates profile + 'usuario' role.
    // If requested role differs, replace it.
    if (role !== "usuario") {
      await admin.from("user_roles").delete().eq("user_id", newUserId);
      const { error: insErr } = await admin
        .from("user_roles")
        .insert({ user_id: newUserId, role });
      if (insErr) return json({ error: insErr.message }, 500);
    }

    return json({ success: true, user_id: newUserId });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
