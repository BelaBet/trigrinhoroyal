"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import {
  CirclesIcon,
  CrownIcon,
  GemIcon,
  HistoryIcon,
  HomeIcon,
  LogoutIcon,
  RocketIcon,
  WalletIcon,
  WheelIcon,
} from "@/components/icons";

const NAV = [
  { href: "/home", label: "Início", icon: HomeIcon },
  { href: "/jogos/crash", label: "Crash", icon: RocketIcon },
  { href: "/jogos/mines", label: "Mines", icon: GemIcon },
  { href: "/jogos/plinko", label: "Plinko", icon: CirclesIcon },
  { href: "/jogos/roulette", label: "Roleta", icon: WheelIcon },
  { href: "/carteira", label: "Carteira", icon: WalletIcon },
  { href: "/historico", label: "Histórico", icon: HistoryIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { balance } = useWallet();

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr] max-[880px]:grid-cols-1">
      <nav className="sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r border-border bg-bg-raise px-4 py-6 min-[881px]:flex">
        <div className="flex items-center gap-2 px-2">
          <CrownIcon className="h-6 w-6 text-brand-gold" />
          <span className="font-display text-base font-extrabold tracking-wide">BETCORE</span>
        </div>
        <div className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-semibold transition ${
                  active ? "bg-brand-violet-soft text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-brand-gold" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <span className="truncate text-xs text-ink-faint">{user?.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-ink"
          >
            <LogoutIcon className="h-4 w-4" />
            Sair
          </button>
        </div>
      </nav>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border bg-bg-raise px-6 py-3 min-[881px]:hidden">
          <div className="flex items-center gap-2">
            <CrownIcon className="h-5 w-5 text-brand-gold" />
            <span className="font-display text-sm font-extrabold">BETCORE</span>
          </div>
        </header>
        <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-3">
          <Link
            href="/carteira"
            className="flex items-center gap-2 rounded-sm border border-border-strong bg-surface px-3.5 py-1.5"
          >
            <WalletIcon className="h-4 w-4 text-brand-gold" />
            <span className="font-mono text-sm font-bold">
              R$ {balance?.realBalance ?? "0,00"}
            </span>
          </Link>
        </div>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
