import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "tecnico" | "usuario";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => fetchRoles(newSession.user.id), 0);
        if (event === "SIGNED_IN" && newSession.user.email) {
          setTimeout(() => {
            supabase.from("access_logs").insert({
              user_id: newSession.user.id,
              user_email: newSession.user.email!,
              action: "login",
            });
          }, 0);
        }
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) fetchRoles(existing.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles((data?.map((r) => r.role) ?? []) as Role[]);
  };

  const signOut = async () => {
    if (user?.email) {
      await supabase.from("access_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "logout",
      });
    }
    await supabase.auth.signOut();
  };

  const isStaff = roles.includes("admin") || roles.includes("tecnico");

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, isStaff, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
