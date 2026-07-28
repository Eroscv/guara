import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SYSADMIN_EMAIL = "eros@guaramedia.com.br";

type ProfileStatus = "pending" | "approved" | "rejected" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSysadmin: boolean;
  profileStatus: ProfileStatus;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  isAdmin: false,
  isSysadmin: false,
  profileStatus: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(null);
  const [loading, setLoading] = useState(true);
  const hydratedUserIdRef = useRef<string | null>(null);
  const hydratingRef = useRef<string | null>(null);

  const hydrateUser = async (u: User) => {
    if (hydratedUserIdRef.current === u.id || hydratingRef.current === u.id) return;
    hydratingRef.current = u.id;
    try {
      const isSys = (u.email || "").toLowerCase() === SYSADMIN_EMAIL;

      const { data: existing } = await supabase
        .from("profiles")
        .select("status")
        .eq("user_id", u.id)
        .maybeSingle();

      let status: ProfileStatus = (existing?.status as ProfileStatus) ?? null;
      if (!existing) {
        const initialStatus = isSys ? "approved" : "pending";
        await supabase.from("profiles").insert({
          user_id: u.id,
          email: u.email ?? "",
          status: initialStatus,
        } as any);
        status = initialStatus;
      } else if (isSys && existing.status !== "approved") {
        await supabase
          .from("profiles")
          .update({ status: "approved", approved_at: new Date().toISOString() } as any)
          .eq("user_id", u.id);
        status = "approved";
      }
      setProfileStatus(status);

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleRow);

      hydratedUserIdRef.current = u.id;
    } finally {
      hydratingRef.current = null;
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      // Keep stable references when nothing meaningful changed
      setSession((prev) =>
        prev?.access_token === sess?.access_token && prev?.user?.id === sess?.user?.id
          ? prev
          : sess
      );
      setUser((prev) => (prev?.id === sess?.user?.id ? prev : sess?.user ?? null));

      if (event === "SIGNED_OUT" || !sess?.user) {
        hydratedUserIdRef.current = null;
        setIsAdmin(false);
        setProfileStatus(null);
        return;
      }

      // Don't rehydrate on token refresh – the user identity is unchanged
      if (event === "TOKEN_REFRESHED") return;

      if (hydratedUserIdRef.current !== sess.user.id) {
        const u = sess.user;
        setTimeout(() => hydrateUser(u), 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) await hydrateUser(sess.user);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSysadmin = (user?.email || "").toLowerCase() === SYSADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isSysadmin, profileStatus, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
