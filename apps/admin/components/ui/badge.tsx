import type { ReactNode } from "react";

const VARIANT_CLASS = {
  on: "bg-state-green-soft text-state-green",
  off: "bg-surface-3 text-ink-faint",
} as const;

export function Badge({
  children,
  variant = "on",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANT_CLASS;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${VARIANT_CLASS[variant]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
