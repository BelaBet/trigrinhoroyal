"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { BetHistoryDto } from "@bet-platform/shared";

function HistoricoContent() {
  const { token } = useAuth();
  const [bets, setBets] = useState<BetHistoryDto[] | null>(null);

  useEffect(() => {
    if (!token) return;
    api.myBets(token).then(setBets).catch(() => setBets([]));
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold">Histórico de jogos</h1>

      <div className="mt-5 overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-bold">Jogo</th>
              <th className="px-4 py-3 font-bold">Aposta</th>
              <th className="px-4 py-3 text-right font-bold">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {(bets ?? []).map((bet) => {
              const net = Number(bet.payoutAmount) - Number(bet.stakeAmount);
              return (
                <tr key={bet.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-semibold">{bet.gameName}</td>
                  <td className="px-4 py-3 font-mono text-sm">R$ {bet.stakeAmount}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                      net >= 0 ? "text-state-green" : "text-state-red"
                    }`}
                  >
                    {net >= 0 ? "+" : "−"} R$ {Math.abs(net).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {bets !== null && bets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-ink-faint">
                  Nenhuma aposta ainda hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <HistoricoContent />
      </AppShell>
    </ProtectedRoute>
  );
}
