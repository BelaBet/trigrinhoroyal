"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import {
  ChevronDownIcon,
  CirclesIcon,
  CrownIcon,
  GemIcon,
  GiftIcon,
  HistoryIcon,
  HomeIcon,
  LogoutIcon,
  RocketIcon,
  SlotIcon,
  WalletIcon,
  WheelIcon,
} from "@/components/icons";

const NAV = [
  { href: "/home", label: "Início", icon: HomeIcon },
  { href: "/cassino", label: "Cassino", icon: SlotIcon },
  { href: "/jogos/crash", label: "Crash", icon: RocketIcon },
  { href: "/jogos/mines", label: "Mines", icon: GemIcon },
  { href: "/jogos/plinko", label: "Plinko", icon: CirclesIcon },
  { href: "/jogos/roulette", label: "Roleta", icon: WheelIcon },
  { href: "/promocoes", label: "Promoções", icon: GiftIcon },
];

function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function WalletMenu() {
  const { balance, refresh } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          refresh();
        }}
        className="flex items-center gap-2 rounded-sm border border-border-strong bg-surface px-3.5 py-1.5 hover:border-brand-gold/50"
      >
        <WalletIcon className="h-4 w-4 text-brand-gold" />
        <span className="font-mono text-sm font-bold">R$ {balance?.realBalance ?? "0,00"}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-faint" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-surface-2 p-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-faint">Saldo real</span>
              <span className="font-mono font-bold">R$ {balance?.realBalance ?? "0,00"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-ink-faint">Saldo bônus</span>
              <span className="font-mono font-bold">R$ {balance?.bonusBalance ?? "0,00"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-ink-faint">Bloqueado</span>
              <span className="font-mono font-bold">R$ {balance?.blockedBalance ?? "0,00"}</span>
            </div>
            <Link
              href="/carteira"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-sm bg-brand-gold py-1.5 text-center text-xs font-bold text-brand-gold-ink hover:bg-brand-gold-strong"
            >
              Ver carteira
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-violet-soft text-xs font-bold text-ink">
          {initialsOf(user?.name)}
        </span>
        <span className="hidden text-sm font-semibold sm:inline">{user?.name?.split(" ")[0]}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-ink-faint" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-border bg-surface-2 p-1.5 shadow-lg">
            <div className="truncate px-2.5 py-2 text-xs text-ink-faint">{user?.email}</div>
            <Link
              href="/carteira"
              onClick={() => setOpen(false)}
              className="block rounded-sm px-2.5 py-2 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink"
            >
              Carteira
            </Link>
            <Link
              href="/historico"
              onClick={() => setOpen(false)}
              className="block rounded-sm px-2.5 py-2 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink"
            >
              Histórico
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm font-semibold text-state-red hover:bg-state-red-soft"
            >
              <LogoutIcon className="h-4 w-4" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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

        <Link
          href="/promocoes"
          className="mt-auto flex flex-col gap-1.5 rounded-md border border-brand-violet-soft bg-gradient-to-br from-brand-violet-soft to-surface p-3.5"
        >
          <GiftIcon className="h-5 w-5 text-brand-gold" />
          <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Bônus de boas-vindas
          </span>
          <span className="font-display text-lg font-extrabold text-brand-gold">Até R$ 100</span>
          <span className="text-[11px] font-bold text-ink-faint">Saiba mais ›</span>
        </Link>
      </nav>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border bg-bg-raise px-6 py-3 min-[881px]:hidden">
          <div className="flex items-center gap-2">
            <CrownIcon className="h-5 w-5 text-brand-gold" />
            <span className="font-display text-sm font-extrabold">BETCORE</span>
          </div>
        </header>
        <div className="flex items-center justify-end gap-3 border-b border-border px-6 py-3">
          <WalletMenu />
          <UserMenu />
        </div>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
