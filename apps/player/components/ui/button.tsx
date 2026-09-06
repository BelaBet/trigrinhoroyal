import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "success" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-brand-gold text-brand-gold-ink hover:bg-brand-gold-strong",
  secondary: "bg-transparent text-ink border border-border-strong hover:bg-surface-2",
  success: "bg-state-green text-[#082712] hover:brightness-110",
  ghost: "bg-transparent text-ink-muted hover:text-ink",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
});
