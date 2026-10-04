"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import supabase from "../../lib/supabaseClient";
import { IDLE_LIMIT_MS, clearActivity, lastActivity, markActivity } from "../../lib/authHelpers";

type AuthState = {
  resolved: boolean;
  user: User | null;
  role: string | null;
  verification: string | null;
  idSubmitted: boolean;
  verificationNote: string | null;
  refreshProfile: () => Promise<void>;
  displayName: string;
  unreadCount: number;
  refreshUnread: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function nameFromUser(user: User | null) {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  const raw = (meta.full_name || meta.name || meta.username || user.email?.split("@")[0] || "Resident") as string;
  return raw.trim();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [resolved, setResolved] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [verification, setVerification] = useState<string | null>(null);
  const [idSubmitted, setIdSubmitted] = useState(false);
  const [verificationNote, setVerificationNote] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = user?.id ?? null;
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const loadUnread = useCallback(async (id: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("is_read", false);

    if (error) {
      console.error(error);
      setUnreadCount(0);
      return;
    }

    setUnreadCount(count ?? 0);
  }, []);

  const setSignedOut = useCallback(() => {
    startTransition(() => {
      setUser(null);
      setRole(null);
      setVerification(null);
      setUnreadCount(0);
      setResolved(true);
    });
  }, []);

  const applyUser = useCallback(
    async (current: User) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, verification_status, id_document_path, verification_note")
        .eq("id", current.id)
        .single();

      startTransition(() => {
        setUser(current);
        setRole((profile?.role ?? "resident").toLowerCase());
        setVerification((profile?.verification_status ?? "pending").toLowerCase());
        setIdSubmitted(Boolean(profile?.id_document_path));
        setVerificationNote(profile?.verification_note ?? null);
        setResolved(true);
      });

      void loadUnread(current.id);
    },
    [loadUnread]
  );

  const syncAuthState = useCallback(async () => {
    const {
      data: { user: current },
      error,
    } = await supabase.auth.getUser();

    if (error || !current) {
      setSignedOut();
      return;
    }
    await applyUser(current);
  }, [applyUser, setSignedOut]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setSignedOut();
        return;
      }
      const last = lastActivity();
      if (last !== null && Date.now() - last > IDLE_LIMIT_MS) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single();
        clearActivity();
        await supabase.auth.signOut();
        window.location.assign(new URL(profile?.role === "admin" ? "/admin/login?reason=idle" : "/login?reason=idle", window.location.origin));
        return;
      }
      await applyUser(data.session.user);
      void syncAuthState();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_IN" && !userIdRef.current) markActivity();
      void syncAuthState();
    });

    return () => subscription.unsubscribe();
  }, [applyUser, setSignedOut, syncAuthState]);

  useEffect(() => {
    if (!userId) return;

    let signingOut = false;
    let lastWrite = 0;

    const signOutIdle = async () => {
      if (signingOut) return;
      signingOut = true;
      clearActivity();
      await supabase.auth.signOut();
      window.location.assign(new URL(role === "admin" ? "/admin/login?reason=idle" : "/login?reason=idle", window.location.origin));
    };

    const isIdle = () => {
      const last = lastActivity();
      return last !== null && Date.now() - last > IDLE_LIMIT_MS;
    };

    const check = () => {
      if (isIdle()) void signOutIdle();
      else if (lastActivity() === null) markActivity();
    };

    const onActivity = () => {
      if (isIdle()) {
        void signOutIdle();
        return;
      }
      const now = Date.now();
      if (now - lastWrite > 15_000) {
        lastWrite = now;
        markActivity();
      }
    };

    check();
    const timer = setInterval(check, 30_000);
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", check);

    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", check);
    };
  }, [role, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-header-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          void loadUnread(userId);
          const type = (payload.new as { type?: string } | null)?.type ?? "";
          if (type.startsWith("account.")) void syncAuthState();
        }
      )
      .subscribe();

    const syncUnread = () => {
      if (document.visibilityState !== "visible") return;
      void loadUnread(userId);
      if (verification === "pending") void syncAuthState();
    };

    window.addEventListener("focus", syncUnread);
    document.addEventListener("visibilitychange", syncUnread);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", syncUnread);
      document.removeEventListener("visibilitychange", syncUnread);
    };
  }, [loadUnread, syncAuthState, userId, verification]);

  const refreshUnread = useCallback(() => {
    if (userId) void loadUnread(userId);
  }, [loadUnread, userId]);

  const logout = useCallback(async () => {
    const wasAdmin = role === "admin";
    clearActivity();
    await supabase.auth.signOut();
    window.location.href = wasAdmin ? "/admin/login" : "/";
  }, [role]);

  return (
    <AuthContext.Provider
      value={{
        resolved,
        user,
        role,
        verification,
        idSubmitted,
        verificationNote,
        refreshProfile: syncAuthState,
        displayName: nameFromUser(user),
        unreadCount,
        refreshUnread,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
