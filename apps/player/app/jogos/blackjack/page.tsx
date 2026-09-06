"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api, ApiError } from "@/lib/api";
import type { BlackjackGameStateDto, PlayingCard } from "@bet-platform/shared";

function CardFace({ card, hidden }: { card?: PlayingCard; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="flex h-20 w-14 items-center justify-center rounded-sm border border-border-strong bg-gradient-to-br from-brand-violet-soft to-surface-2">
        <span className="text-lg">🂠</span>
      </div>
    );
  }
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className="flex h-20 w-14 flex-col items-center justify-center gap-0.5 rounded-sm border border-border-strong bg-white">
      <span className={`text-lg font-bold ${isRed ? "text-state-red" : "text-[#12162a]"}`}>{card.rank}</span>
      <span className={`text-lg ${isRed ? "text-state-red" : "text-[#12162a]"}`}>{card.suit}</span>
    </div>
  );
}

function resultLabel(game: BlackjackGameStateDto): { text: string; tone: string } {
  if (game.status === "WON") return { text: `Ganhou R$ ${game.payoutAmount}!`, tone: "text-state-green" };
  if (game.status === "PUSH") return { text: "Empate — aposta devolvida.", tone: "text-ink-muted" };
  return { text: "Dealer venceu.", tone: "text-state-red" };
}

function BlackjackContent() {
  const { token } = useAuth();
  const { refresh } = useWallet();
  const [stake, setStake] = useState("10");
  const [game, setGame] = useState<BlackjackGameStateDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlaying = game?.status === "PENDING";
  const isOver = game && game.status !== "PENDING";

  async function run(action: () => Promise<BlackjackGameStateDto>) {
    setLoading(true);
    setError(null);
    try {
      const state = await action();
      setGame(state);
      if (state.status !== "PENDING") await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível completar a ação.");
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (!token) return;
    run(() => api.blackjackStart(token, { stakeAmount: Number(stake) }));
  }
  function handleHit() {
    if (!token || !game) return;
    run(() => api.blackjackAction(token, game.betId, "hit"));
  }
  function handleDouble() {
    if (!token || !game) return;
    run(() => api.blackjackAction(token, game.betId, "double"));
  }
  function handleStand() {
    if (!token || !game) return;
    run(() => api.blackjackAction(token, game.betId, "stand"));
  }
  function handleReset() {
    setGame(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">Blackjack</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-border bg-gradient-to-br from-[#0f2a1c] to-surface p-6">
          <div className="mb-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
              Dealer {game && isOver ? `— ${game.dealerTotal}` : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {game ? (
                isPlaying ? (
                  <>
                    <CardFace card={game.dealerCards[0]} />
                    <CardFace hidden />
                  </>
                ) : (
                  game.dealerCards.map((card, i) => <CardFace key={i} card={card} />)
                )
              ) : (
                <>
                  <CardFace hidden />
                  <CardFace hidden />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
              Você {game ? `— ${game.playerTotal}` : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {game ? (
                game.playerCards.map((card, i) => <CardFace key={i} card={card} />)
              ) : (
                <>
                  <CardFace hidden />
                  <CardFace hidden />
                </>
              )}
            </div>
          </div>

          {game && isOver && (
            <p className={`mt-6 text-sm font-semibold ${resultLabel(game).tone}`}>{resultLabel(game).text}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          {!game && (
            <>
              <Field
                label="Aposta (R$)"
                type="number"
                min={1}
                step="1"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
              <Button variant="primary" disabled={loading} onClick={handleStart} className="justify-center">
                {loading ? "Distribuindo…" : "Apostar"}
              </Button>
            </>
          )}

          {game && isPlaying && (
            <>
              <Button variant="primary" disabled={loading || !game.canHit} onClick={handleHit} className="justify-center">
                Pedir
              </Button>
              <Button variant="secondary" disabled={loading} onClick={handleStand} className="justify-center">
                Parar
              </Button>
              <Button
                variant="success"
                disabled={loading || !game.canDouble}
                onClick={handleDouble}
                className="justify-center"
              >
                Dobrar
              </Button>
            </>
          )}

          {game && isOver && (
            <Button variant="secondary" onClick={handleReset} className="justify-center">
              Jogar novamente
            </Button>
          )}

          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BlackjackPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <BlackjackContent />
      </AppShell>
    </ProtectedRoute>
  );
}
