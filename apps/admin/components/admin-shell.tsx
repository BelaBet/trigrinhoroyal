import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/bonus", label: "Bônus" },
];

export function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[180px_1fr]">
      <nav className="flex flex-col gap-1 border-r border-border bg-bg-raise px-3 py-6">
        <div className="mb-5 px-2 font-display text-sm font-extrabold tracking-wide">
          BETCORE <span className="text-brand-gold">ADMIN</span>
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-sm px-2.5 py-2 text-sm font-semibold ${
              active === item.href
                ? "bg-brand-violet-soft text-ink"
                : "text-ink-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="px-8 py-8">{children}</main>
    </div>
  );
}
