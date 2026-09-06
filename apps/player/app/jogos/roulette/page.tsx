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

type RouletteBet =
  | { kind: "straight"; number: number }
  | { kind: "color"; color: "red" | "black" }
  | { kind: "parity"; parity: "even" | "odd" }
  | { kind: "range"; range: "low" | "high" };

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const NUMBERS = Array.from({ length: 37 }, (_, i) => i);

function colorOf(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

function betLabel(bet: RouletteBet): string {
  switch (bet.kind) {
    case "straight":
      return `Número ${bet.number}`;
    case "color":
      return bet.color === "red" ? "Vermelho" : "Preto";
    case "parity":
      return bet.parity === "even" ? "Par" : "Ímpar";
    case "range":
      return bet.range === "low" ? "1-18" : "19-36";
  }
}

function RouletteContent() {
  const { token } = useAuth();
  const { refresh } = useWallet();
  const [stake, setStake] = useState("10");
  const [bet, setBet] = useState<RouletteBet>({ kind: "color", color: "red" });
  const [result, setResult] = useState<BetResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBet() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.placeBet(token, {
        gameSlug: "roulette",
        stakeAmount: Number(stake),
        params: { bet },
      });
      setResult(response);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível apostar agora.");
    } finally {
      setLoading(false);
    }
  }

  const resultNumber = result?.outcome?.number as number | undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">Roulette</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="mb-4 flex min-h-[96px] flex-col items-center justify-center gap-1">
            {result ? (
              <>
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full font-mono text-2xl font-bold text-white ${
                    colorOf(resultNumber ?? 0) === "red"
                      ? "bg-state-red"
                      : colorOf(resultNumber ?? 0) === "black"
                        ? "bg-[#1a1f2e]"
                        : "bg-state-green"
                  }`}
                >
                  {resultNumber}
                </div>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    result.status === "WON" ? "text-state-green" : "text-state-red"
                  }`}
                >
                  {result.status === "WON"
                    ? `Ganhou R$ ${result.payoutAmount}`
                    : `Perdeu R$ ${result.stakeAmount}`}
                </p>
              </>
            ) : (
              <span className="text-sm text-ink-faint">Escolha uma aposta e gire a roleta.</span>
            )}
          </div>

          <div className="grid grid-cols-9 gap-1">
            {NUMBERS.map((n) => {
              const active = bet.kind === "straight" && bet.number === n;
              const color = colorOf(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBet({ kind: "straight", number: n })}
                  className={`aspect-square rounded-sm font-mono text-[11px] font-bold text-white ${
                    color === "red" ? "bg-state-red/80" : color === "black" ? "bg-[#1a1f2e]" : "bg-state-green/80"
                  } ${active ? "ring-2 ring-brand-gold" : ""}`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {(
              [
                [{ kind: "color", color: "red" }, "Vermelho"],
                [{ kind: "color", color: "black" }, "Preto"],
                [{ kind: "parity", parity: "even" }, "Par"],
                [{ kind: "parity", parity: "odd" }, "Ímpar"],
                [{ kind: "range", range: "low" }, "1-18"],
                [{ kind: "range", range: "high" }, "19-36"],
              ] as [RouletteBet, string][]
            ).map(([option, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setBet(option)}
                className={`rounded-sm border py-2 text-xs font-bold ${
                  JSON.stringify(bet) === JSON.stringify(option)
                    ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                    : "border-border-strong text-ink-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <Field label="Aposta (R$)" type="number" min={1} step="0.5" value={stake} onChange={(e) => setStake(e.target.value)} />
          <div className="text-xs">
            <span className="text-ink-faint">Escolha atual</span>
            <div className="mt-1 font-semibold">{betLabel(bet)}</div>
          </div>
          <Button variant="primary" disabled={loading} onClick={handleBet} className="justify-center">
            {loading ? "Girando…" : "Apostar"}
          </Button>
          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function RoulettePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <RouletteContent />
      </AppShell>
    </ProtectedRoute>
  );
}
