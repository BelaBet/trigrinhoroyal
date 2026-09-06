"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api } from "@/lib/api";
import type { NotificationDto } from "@bet-platform/shared";
import {
  BellIcon,
  CardsIcon,
  ChevronDownIcon,
  CirclesIcon,
  CrownIcon,
  GemIcon,
  GiftIcon,
  HistoryIcon,
  HomeIcon,
  LogoutIcon,
  RocketIcon,
  SearchIcon,
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
  { href: "/jogos/blackjack", label: "Blackjack", icon: CardsIcon },
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

function SearchBox() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(term.trim() ? `/cassino?q=${encodeURIComponent(term.trim())}` : "/cassino");
  }

  return (
    <form onSubmit={handleSubmit} className="hidden items-center gap-2 rounded-sm border border-border-strong bg-surface px-3 py-1.5 md:flex">
      <SearchIcon className="h-4 w-4 text-ink-faint" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar jogos…"
        className="w-36 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
      />
    </form>
  );
}

function NotificationsMenu() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[] | null>(null);
  const unreadCount = items?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    if (!token) return;
    api.notifications(token).then(setItems).catch(() => setItems([]));
  }, [token]);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!token) return;
    const data = await api.notifications(token);
    setItems(data);
  }

  async function handleMarkAll() {
    if (!token) return;
    await api.markAllNotificationsRead(token);
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
  }

  return (
    <div className="relative">
      <button type="button" onClick={handleOpen} className="relative rounded-sm p-2 hover:bg-surface">
        <BellIcon className="h-5 w-5 text-ink-muted" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-state-red text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-md border border-border bg-surface-2 p-2 shadow-lg">
            <div className="flex items-center justify-between px-1.5 py-1">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Notificações</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="text-[11px] font-bold text-brand-gold">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="mt-1 flex max-h-72 flex-col gap-1 overflow-y-auto">
              {(items ?? []).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-sm px-2.5 py-2 ${n.read ? "opacity-60" : "bg-brand-violet-soft/40"}`}
                >
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <div className="mt-0.5 text-xs text-ink-muted">{n.body}</div>}
                  <div className="mt-1 text-[10px] text-ink-faint">
                    {new Date(n.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
              {items !== null && items.length === 0 && (
                <p className="px-2.5 py-4 text-center text-xs text-ink-faint">Nenhuma notificação ainda.</p>
              )}
            </div>
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
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
          <SearchBox />
          <div className="flex items-center gap-3">
            <NotificationsMenu />
            <WalletMenu />
            <UserMenu />
          </div>
        </div>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
