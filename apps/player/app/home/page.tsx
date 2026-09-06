"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CirclesIcon, GemIcon, RocketIcon, WheelIcon } from "@/components/icons";
import { api } from "@/lib/api";
import type { GameSummaryDto } from "@bet-platform/shared";

const GAME_ICON: Record<string, typeof RocketIcon> = {
  crash: RocketIcon,
  mines: GemIcon,
  plinko: CirclesIcon,
  roulette: WheelIcon,
};

const GAME_ART: Record<string, string> = {
  crash: "from-[#3a1240] to-[#7c2d12]",
  mines: "from-[#122d1e] to-[#0f3d2e]",
  plinko: "from-[#241a45] to-[#4c1d95]",
  roulette: "from-[#3a0f16] to-[#7a1224]",
};

function HomeContent() {
  const [games, setGames] = useState<GameSummaryDto[] | null>(null);

  useEffect(() => {
    api.games().then(setGames).catch(() => setGames([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-md border border-border p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_160%_at_100%_0%,rgba(245,180,0,0.18),transparent_60%),linear-gradient(120deg,#241a45,#3a1240)]" />
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-strong">
            Bônus de boas-vindas
          </span>
          <h2 className="mt-2 max-w-sm font-display text-xl font-bold text-balance">
            Deposite hoje e ganhe até R$100 de bônus
          </h2>
          <Link href="/carteira" className="mt-4 inline-block">
            <Button variant="primary" className="text-xs">
              Depositar agora
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">🔥 Em alta</h3>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(games ?? []).map((game) => {
          const Icon = GAME_ICON[game.slug] ?? RocketIcon;
          return (
            <Link
              key={game.id}
              href={`/jogos/${game.slug}`}
              className="overflow-hidden rounded-md border border-border bg-surface transition hover:-translate-y-0.5 hover:border-border-strong"
            >
              <div
                className={`flex h-24 items-center justify-center bg-gradient-to-br ${GAME_ART[game.slug] ?? "from-surface-2 to-surface"}`}
              >
                <Icon className="h-8 w-8 text-white/90" />
              </div>
              <div className="px-3 py-2.5">
                <div className="text-sm font-bold">{game.name}</div>
                <div className="text-[11px] text-ink-faint">RTP {game.rtp}%</div>
              </div>
            </Link>
          );
        })}
        {games === null && (
          <div className="col-span-full text-sm text-ink-faint">Carregando catálogo…</div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <HomeContent />
      </AppShell>
    </ProtectedRoute>
  );
}
