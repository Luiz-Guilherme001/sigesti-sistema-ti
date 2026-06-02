import { useEffect, useState, createContext, useContext, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type Role = "admin" | "tecnico" | "usuario";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  roles: Role[];
  isAdmin: boolean;
  isStaff: boolean;
  isUser: boolean;
  signOut: () => Promise<void>;
  userProfile: {
    user_id: string;
    nome: string;
    email: string;
    setor_id: string | null;
  } | null;
  userSetor: { id: string; nome: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    nome: string;
    email: string;
    setor_id: string | null;
  } | null>(null);
  const [userSetor, setUserSetor] = useState<{ id: string; nome: string } | null>(null);

  const lastSessionRef = useRef<string | null>(null);

  const fetchRoles = async (userId: string) => {
    setRolesLoading(true);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data?.map((r) => r.role) ?? []) as Role[]);
    setRolesLoading(false);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, nome, email, setor_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      return;
    }

    if (profile) {
      setUserProfile(profile);
      if (profile.setor_id) {
        const { data: setor, error: setorError } = await supabase
          .from("setores")
          .select("id, nome")
          .eq("id", profile.setor_id)
          .maybeSingle();
        if (!setorError && setor) {
          setUserSetor(setor);
        } else {
          setUserSetor(null);
        }
      } else {
        setUserSetor(null);
      }
    }
  };

  const registrarLogin = async (userId: string, email: string, expiresAt: number) => {
    const key = `${userId}-${expiresAt}`;
    if (lastSessionRef.current === key) return;
    lastSessionRef.current = key;
    const { error } = await supabase.from("access_logs").insert({
      user_id: userId,
      user_email: email,
      action: "login",
    });
    if (error) console.error("Erro ao registrar login:", error.message);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchRoles(existing.user.id);
        fetchUserProfile(existing.user.id);
      } else {
        setRolesLoading(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setRoles([]);
        setRolesLoading(false);
        setUserProfile(null);
        setUserSetor(null);
        window.location.href = "/atualizar-senha";
        return;
      }

      if (newSession?.user) {
        setTimeout(() => {
          fetchRoles(newSession.user.id);
          fetchUserProfile(newSession.user.id);
        }, 0);

        if (event === "SIGNED_IN" && newSession.user.email) {
          registrarLogin(newSession.user.id, newSession.user.email, newSession.expires_at);
        }
      } else {
        lastSessionRef.current = null;
        setRoles([]);
        setRolesLoading(false);
        setUserProfile(null);
        setUserSetor(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
  if (user?.id && user?.email) {
    await supabase.from("access_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "logout",
    });
  }
  await supabase.auth.signOut();
  await new Promise((resolve) => setTimeout(resolve, 500)); // aguarda tudo terminar
  window.location.href = "/";
};

  const isAdmin = roles.includes("admin");
  const isStaff = roles.includes("admin") || roles.includes("tecnico");
  const isUser = roles.includes("usuario") && !isStaff;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      rolesLoading,
      roles,
      isAdmin,
      isStaff,
      isUser,
      signOut,
      userProfile,
      userSetor,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;