"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { BombIcon, GemIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api, ApiError } from "@/lib/api";
import type { MinesGameStateDto } from "@bet-platform/shared";

const GRID_SIZE = 25;

function CellButton({
  index,
  game,
  onClick,
  disabled,
}: {
  index: number;
  game: MinesGameStateDto | null;
  onClick: () => void;
  disabled: boolean;
}) {
  const revealed = game?.revealedCells.includes(index) ?? false;
  const isMine = game?.minePositions?.includes(index) ?? false;
  const gameOver = game && game.status !== "PENDING";

  let content: React.ReactNode = null;
  let tone = "bg-surface border-border-strong hover:border-brand-gold/60";

  if (revealed) {
    content = <GemIcon className="h-5 w-5 text-state-green" />;
    tone = "bg-state-green-soft border-state-green/40";
  } else if (gameOver && isMine) {
    content = <BombIcon className="h-5 w-5 text-state-red" />;
    tone = "bg-state-red-soft border-state-red/40";
  } else if (gameOver) {
    tone = "bg-surface border-border opacity-40";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || revealed || Boolean(gameOver)}
      className={`aspect-square rounded-sm border flex items-center justify-center transition disabled:cursor-not-allowed ${tone}`}
    >
      {content}
    </button>
  );
}

function MinesContent() {
  const { token } = useAuth();
  const { refresh } = useWallet();
  const [stake, setStake] = useState("5");
  const [minesCount, setMinesCount] = useState("3");
  const [game, setGame] = useState<MinesGameStateDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPlaying = game?.status === "PENDING";
  const isOver = game && game.status !== "PENDING";

  async function handleStart() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const state = await api.minesStart(token, { stakeAmount: Number(stake), minesCount: Number(minesCount) });
      setGame(state);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a rodada.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal(cellIndex: number) {
    if (!token || !game) return;
    setLoading(true);
    setError(null);
    try {
      const state = await api.minesReveal(token, game.betId, cellIndex);
      setGame(state);
      if (state.status !== "PENDING") await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível revelar essa célula.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!token || !game) return;
    setLoading(true);
    setError(null);
    try {
      const state = await api.minesCashout(token, game.betId);
      setGame(state);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível retirar agora.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setGame(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 font-display text-xl font-bold">Mines</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <CellButton key={i} index={i} game={game} disabled={loading || !isPlaying} onClick={() => handleReveal(i)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
          {!game && (
            <>
              <Field
                label="Aposta (R$)"
                type="number"
                min={1}
                step="0.5"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
              />
              <Field
                label="Minas"
                type="number"
                min={1}
                max={24}
                value={minesCount}
                onChange={(e) => setMinesCount(e.target.value)}
              />
              <Button variant="primary" disabled={loading} onClick={handleStart} className="justify-center">
                {loading ? "Iniciando…" : "Iniciar"}
              </Button>
            </>
          )}

          {game && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-ink-faint">Minas</span>
                <span className="font-mono font-semibold">{game.minesCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-faint">Multiplicador</span>
                <span className="font-mono font-semibold text-brand-gold">{game.currentMultiplier}x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-faint">
                  {isPlaying ? "Retirar agora" : game.status === "WON" ? "Prêmio" : "Resultado"}
                </span>
                <span
                  className={`font-mono font-semibold ${game.status === "LOST" ? "text-state-red" : "text-state-green"}`}
                >
                  R$ {game.potentialPayout}
                </span>
              </div>

              {isPlaying && (
                <Button
                  variant="success"
                  disabled={loading || game.revealedCells.length === 0}
                  onClick={handleCashout}
                  className="justify-center"
                >
                  Retirar
                </Button>
              )}

              {isOver && (
                <>
                  <p className={`text-xs font-semibold ${game.status === "WON" ? "text-state-green" : "text-state-red"}`}>
                    {game.status === "WON" ? "Você retirou a tempo!" : "Encontrou uma mina."}
                  </p>
                  <Button variant="secondary" onClick={handleReset} className="justify-center">
                    Jogar novamente
                  </Button>
                </>
              )}
            </>
          )}

          {error && <p className="text-xs font-semibold text-state-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function MinesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <MinesContent />
      </AppShell>
    </ProtectedRoute>
  );
}
