import { type InputHTMLAttributes, forwardRef } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, className = "", ...props },
  ref,
) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</span>
      <input
        ref={ref}
        className={`w-full rounded-sm border border-border-strong bg-bg-raise px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/40 ${className}`}
        {...props}
      />
    </label>
  );
});
