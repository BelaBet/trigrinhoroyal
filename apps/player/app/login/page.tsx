"use client";

import Link from "next/link";
import { useState } from "react";
import { CrownIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-surface p-8">
        <CrownIcon className="h-7 w-7 text-brand-gold" />
        <h1 className="mt-3 font-display text-xl font-bold">Bem-vindo de volta!</h1>
        <p className="mt-1 text-sm text-ink-muted">Faça login e continue sua diversão.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <Field
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Senha"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm font-semibold text-state-red">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-1 justify-center">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-faint">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="font-bold text-brand-gold">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
