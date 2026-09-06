/**
 * BetCore design tokens — fonte única de verdade para as duas apps Next.js
 * (player e admin). Espelha o design system publicado como Artifact
 * ("BetCore Design System"): fundo escuro fixo, dourado para ação/dinheiro,
 * violeta para destaque promocional, verde/vermelho só para resultado
 * financeiro.
 */

export const colors = {
  bg: "#0a0e1c",
  bgRaise: "#0d1224",
  surface: "#121a30",
  surface2: "#1a2440",
  surface3: "#212c4d",
  border: "rgba(150,163,196,0.14)",
  borderStrong: "rgba(150,163,196,0.26)",
  text: "#eef1fa",
  textMuted: "#8b93ac",
  textFaint: "#5d6785",
  gold: "#f5b400",
  goldStrong: "#ffcf47",
  goldInk: "#1a1304",
  violet: "#8b5cf6",
  violetDeep: "#4c1d95",
  violetSoft: "rgba(139,92,246,0.16)",
  green: "#22c55e",
  greenSoft: "rgba(34,197,94,0.14)",
  red: "#f0475a",
  redSoft: "rgba(240,71,90,0.14)",
} as const;

export const fontFamily = {
  display: ["Sora", "system-ui", "sans-serif"],
  body: ["Manrope", "system-ui", "sans-serif"],
  mono: ["JetBrains Mono", "ui-monospace", "monospace"],
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
  7: "48px",
  8: "64px",
} as const;

export const radius = {
  sm: "8px",
  md: "14px",
  lg: "20px",
  pill: "999px",
} as const;

export const tokens = { colors, fontFamily, spacing, radius } as const;
