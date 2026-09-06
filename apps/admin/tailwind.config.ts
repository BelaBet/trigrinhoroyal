import type { Config } from "tailwindcss";
import { colors } from "@bet-platform/shared";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        "bg-raise": colors.bgRaise,
        surface: colors.surface,
        "surface-2": colors.surface2,
        "surface-3": colors.surface3,
        border: colors.border,
        "border-strong": colors.borderStrong,
        ink: colors.text,
        "ink-muted": colors.textMuted,
        "ink-faint": colors.textFaint,
        brand: {
          gold: colors.gold,
          "gold-strong": colors.goldStrong,
          "gold-ink": colors.goldInk,
          violet: colors.violet,
          "violet-soft": colors.violetSoft,
        },
        state: {
          green: colors.green,
          "green-soft": colors.greenSoft,
          red: colors.red,
          "red-soft": colors.redSoft,
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
