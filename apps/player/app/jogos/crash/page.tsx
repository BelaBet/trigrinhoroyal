"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api, ApiError } from "@/lib/api";
import type { BetResultDto } from "@bet-platform/shared";

function CrashContent() {
  const { token } = useAuth();
  const { balance, refresh } = useWallet();
  const [stake, setStake] = useState("10");
  const [cashout, setCashout] = useState("1.50");
  const [result, setResult] = useState<BetResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleBet() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.placeBet(token, {
        gameSlug: "crash",
        stakeAmount: Number(stake),
        params: { cashoutMultiplier: Number(cashout) },
      });
      setResult(response);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível apostar agora.");
    } finally {
      setLoading(false);
    }
  }

  const crashPoint = result?.outcome?.crashPoint as number | undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">Crash</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-md border border-border bg-[radial-gradient(80%_100%_at_30%_20%,rgba(245,180,0,0.1),transparent_60%)]">
          {result && (
            <span className="absolute left-4 top-3.5 font-mono text-[11px] text-ink-faint">
              rodada #{result.roundId.slice(-6)}
            </span>
          )}
          {result ? (
            <>
              <div
                className={`font-mono text-4xl font-semibold ${
                  result.status === "WON" ? "text-state-green" : "text-state-red"
                }`}
              >
                {crashPoint?.toFixed(2)}x
              </div>
              <span className="text-xs text-ink-faint">
                {result.status === "WON"
                  ? `Você saiu em ${cashout}x — ganhou R$ ${result.payoutAmount}`
                  : `Crashou antes de ${cashout}x — perdeu R$ ${result.stakeAmount}`}
              </span>
            </>
          ) : (
            <span className="text-sm text-ink-faint">Faça sua aposta para começar a rodada.</span>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <Field
            label="Aposta (R$)"
            type="number"
            min={1}
            step="0.5"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
          <Field
            label="Auto cashout"
            type="number"
            min={1.01}
            step="0.01"
            value={cashout}
            onChange={(e) => setCashout(e.target.value)}
          />
          <Button variant="primary" disabled={loading} onClick={handleBet} className="justify-center">
            {loading ? "Apostando…" : "Apostar"}
          </Button>
          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
          <div className="flex justify-between border-t border-border pt-3 text-xs">
            <span className="text-ink-faint">Saldo</span>
            <span className="font-mono font-semibold">R$ {balance?.realBalance ?? "0,00"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CrashPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CrashContent />
      </AppShell>
    </ProtectedRoute>
  );
}
