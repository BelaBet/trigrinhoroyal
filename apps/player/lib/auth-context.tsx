"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import type { AuthSession, AuthUser, LoginInput, SignUpInput } from "@bet-platform/shared";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "betcore.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const session: AuthSession = JSON.parse(raw);
        setUser(session.user);
        setToken(session.accessToken);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = useCallback((session: AuthSession) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session.user);
    setToken(session.accessToken);
  }, []);

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const session = await api.signUp(input);
      persist(session);
      router.push("/home");
    },
    [persist, router],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await api.login(input);
      persist(session);
      router.push("/home");
    },
    [persist, router],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
