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

/**
 * Mesma tabela de multiplicadores do @bet-platform/game-engine-plinko —
 * duplicada aqui de propósito: aquele pacote importa @bet-platform/shared,
 * que usa node:crypto, e não pode ser importado num componente client-side.
 * O resultado real sempre vem do servidor; isto é só para desenhar a fileira.
 */
type RiskLevel = "low" | "medium" | "high";
const MULTIPLIER_TABLES: Record<RiskLevel, number[]> = {
  low: [8, 4, 2, 1.4, 1.2, 1.1, 1, 0.7, 0.5, 0.7, 1, 1.1, 1.2, 1.4, 2, 4, 8],
  medium: [43, 15, 7, 4, 2, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 2, 4, 7, 15, 43],
  high: [420, 60, 18, 8, 3, 1.5, 0.6, 0.2, 0.1, 0.2, 0.6, 1.5, 3, 8, 18, 60, 420],
};
const ROWS = 16;

function PegTriangle({ bucketIndex }: { bucketIndex: number | null }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} className="flex gap-2">
          {Array.from({ length: row + 1 }, (_, col) => (
            <span key={col} className="h-1.5 w-1.5 rounded-full bg-border-strong" />
          ))}
        </div>
      ))}
      <div className="mt-1 flex gap-1">
        {MULTIPLIER_TABLES.medium.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-4 rounded-sm ${i === bucketIndex ? "bg-brand-gold" : "bg-surface-3"}`}
          />
        ))}
      </div>
    </div>
  );
}

function MultiplierRow({ risk, highlight }: { risk: RiskLevel; highlight: number | null }) {
  return (
    <div className="flex gap-1">
      {MULTIPLIER_TABLES[risk].map((mult, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm py-1.5 text-center font-mono text-[10px] font-bold ${
            i === highlight ? "bg-brand-gold text-brand-gold-ink" : "bg-surface-3 text-ink-muted"
          }`}
        >
          {mult}x
        </div>
      ))}
    </div>
  );
}

function PlinkoContent() {
  const { token } = useAuth();
  const { refresh } = useWallet();
  const [stake, setStake] = useState("10");
  const [risk, setRisk] = useState<RiskLevel>("medium");
  const [result, setResult] = useState<BetResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlay() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.placeBet(token, {
        gameSlug: "plinko",
        stakeAmount: Number(stake),
        params: { risk },
      });
      setResult(response);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível jogar agora.");
    } finally {
      setLoading(false);
    }
  }

  const bucketIndex = (result?.outcome?.bucketIndex as number | undefined) ?? null;
  const resolvedRisk = (result?.outcome?.risk as RiskLevel | undefined) ?? risk;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">Plinko</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-border bg-surface p-4">
          <PegTriangle bucketIndex={bucketIndex} />
          <MultiplierRow risk={resolvedRisk} highlight={bucketIndex} />
          {result && (
            <p
              className={`mt-4 text-center text-sm font-semibold ${
                result.status === "WON" ? "text-state-green" : "text-state-red"
              }`}
            >
              {result.status === "WON"
                ? `Caiu no ${result.multiplier}x — ganhou R$ ${result.payoutAmount}`
                : `Caiu no ${result.multiplier}x — perdeu R$ ${result.stakeAmount}`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <Field label="Aposta (R$)" type="number" min={1} step="0.5" value={stake} onChange={(e) => setStake(e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Risco</span>
            <div className="flex gap-1.5">
              {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRisk(level)}
                  className={`flex-1 rounded-sm border py-1.5 text-xs font-bold capitalize ${
                    risk === level
                      ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                      : "border-border-strong text-ink-muted"
                  }`}
                >
                  {level === "low" ? "Baixo" : level === "medium" ? "Médio" : "Alto"}
                </button>
              ))}
            </div>
          </label>
          <Button variant="primary" disabled={loading} onClick={handlePlay} className="justify-center">
            {loading ? "Jogando…" : "Jogar"}
          </Button>
          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PlinkoPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PlinkoContent />
      </AppShell>
    </ProtectedRoute>
  );
}
