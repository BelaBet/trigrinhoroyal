"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { CirclesIcon, GemIcon, RocketIcon, SlotIcon, WheelIcon } from "@/components/icons";
import { api } from "@/lib/api";
import type { GameSummaryDto } from "@bet-platform/shared";

const CATEGORY_ICON: Record<string, typeof RocketIcon> = {
  SLOTS: SlotIcon,
  CRASH: RocketIcon,
  MINES: GemIcon,
  PLINKO: CirclesIcon,
  ROULETTE: WheelIcon,
};

const CATEGORY_ART: Record<string, string> = {
  SLOTS: "from-[#3a2a12] to-[#7a4a12]",
  CRASH: "from-[#3a1240] to-[#7c2d12]",
  MINES: "from-[#122d1e] to-[#0f3d2e]",
  PLINKO: "from-[#241a45] to-[#4c1d95]",
  ROULETTE: "from-[#3a0f16] to-[#7a1224]",
};

const CATEGORIES = [
  { value: "ALL", label: "Todos" },
  { value: "SLOTS", label: "Slots" },
  { value: "CRASH", label: "Crash" },
  { value: "MINES", label: "Mines" },
  { value: "PLINKO", label: "Plinko" },
  { value: "ROULETTE", label: "Roleta" },
];

function gameHref(game: GameSummaryDto): string {
  return game.type === "SLOTS" ? `/jogos/slots/${game.slug}` : `/jogos/${game.slug}`;
}

function CassinoContent() {
  const [games, setGames] = useState<GameSummaryDto[] | null>(null);
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
    api.games().then(setGames).catch(() => setGames([]));
  }, []);

  const filtered = (games ?? []).filter((g) => category === "ALL" || g.type === category);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-md border border-border p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_160%_at_100%_0%,rgba(245,180,0,0.18),transparent_60%),linear-gradient(120deg,#3a2a12,#241a45)]" />
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-strong">Cassino</span>
          <h1 className="mt-2 font-display text-xl font-bold text-balance">Slots, crash games e mesas ao vivo</h1>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              category === cat.value
                ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                : "border-border-strong text-ink-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((game) => {
          const Icon = CATEGORY_ICON[game.type] ?? SlotIcon;
          return (
            <Link
              key={game.id}
              href={gameHref(game)}
              className="overflow-hidden rounded-md border border-border bg-surface transition hover:-translate-y-0.5 hover:border-border-strong"
            >
              <div
                className={`flex h-24 items-center justify-center bg-gradient-to-br ${CATEGORY_ART[game.type] ?? "from-surface-2 to-surface"}`}
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
        {games === null && <div className="col-span-full text-sm text-ink-faint">Carregando catálogo…</div>}
        {games !== null && filtered.length === 0 && (
          <div className="col-span-full text-sm text-ink-faint">Nenhum jogo nessa categoria.</div>
        )}
      </div>
    </div>
  );
}

export default function CassinoPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CassinoContent />
      </AppShell>
    </ProtectedRoute>
  );
}
