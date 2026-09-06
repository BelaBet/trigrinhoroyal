"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api, ApiError } from "@/lib/api";
import type { BetResultDto, GameSummaryDto } from "@bet-platform/shared";

const SYMBOL_GLYPH: Record<string, string> = {
  CHERRY: "🍒",
  LEMON: "🍋",
  BELL: "🔔",
  GEM: "💎",
  CROWN: "👑",
  WILD: "⭐",
};

/** Mesmas 5 linhas do @bet-platform/game-engine-slots — só para destacar
 * visualmente as células vencedoras (o resultado real vem do servidor). */
const PAYLINES: Array<Array<[number, number]>> = [
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export default function SlotPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return (
    <ProtectedRoute>
      <AppShell>
        <SlotContent slug={slug} />
      </AppShell>
    </ProtectedRoute>
  );
}

function SlotContent({ slug }: { slug: string }) {
  const { token } = useAuth();
  const { refresh } = useWallet();
  const [game, setGame] = useState<GameSummaryDto | null>(null);
  const [stake, setStake] = useState("5");
  const [result, setResult] = useState<BetResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .games()
      .then((games) => setGame(games.find((g) => g.slug === slug) ?? null))
      .catch(() => setGame(null));
  }, [slug]);

  async function handleSpin() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.placeBet(token, { gameSlug: slug, stakeAmount: Number(stake) });
      setResult(response);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível girar agora.");
    } finally {
      setLoading(false);
    }
  }

  const grid = result?.outcome?.grid as string[][] | undefined;
  const wins = (result?.outcome?.wins as Array<{ lineIndex: number }> | undefined) ?? [];
  const winningCells = new Set(
    wins.flatMap((w) => PAYLINES[w.lineIndex].map(([reel, row]) => `${reel}-${row}`)),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">{game?.name ?? "Slot"}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-border bg-gradient-to-br from-[#241a12] to-surface p-6">
          <div className="mx-auto grid w-fit grid-cols-3 gap-2">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((reel) => {
                const symbol = grid?.[reel]?.[row];
                const isWinning = winningCells.has(`${reel}-${row}`);
                return (
                  <div
                    key={`${reel}-${row}`}
                    className={`flex h-16 w-16 items-center justify-center rounded-sm border text-3xl ${
                      isWinning
                        ? "border-brand-gold bg-brand-gold/15"
                        : "border-border-strong bg-bg-raise"
                    }`}
                  >
                    {symbol ? SYMBOL_GLYPH[symbol] : "❔"}
                  </div>
                );
              }),
            )}
          </div>
          {result && (
            <p
              className={`mt-4 text-center text-sm font-semibold ${
                result.status === "WON" ? "text-state-green" : "text-state-red"
              }`}
            >
              {result.status === "WON"
                ? `Ganhou R$ ${result.payoutAmount} (${wins.length} linha${wins.length === 1 ? "" : "s"})`
                : "Sem combinação — tente de novo."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          <Field
            label="Aposta (R$)"
            type="number"
            min={game ? Number(game.minBet) : 0.5}
            step="0.5"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
          <Button variant="primary" disabled={loading} onClick={handleSpin} className="justify-center">
            {loading ? "Girando…" : "Girar"}
          </Button>
          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
          <div className="border-t border-border pt-3 text-[11px] text-ink-faint">
            5 linhas de pagamento — a aposta é dividida igualmente entre elas.
            {game && (
              <>
                {" "}
                RTP {game.rtp}%.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
