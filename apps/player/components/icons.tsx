import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const CrownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
    <path d="M5 21h14" />
  </svg>
);

export const WalletIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1" />
  </svg>
);

export const RocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 3c3 1 5 4 5 8 0 3-2 6-5 10-3-4-5-7-5-10 0-4 2-7 5-8z" />
    <circle cx="12" cy="10" r="1.6" />
    <path d="M8 16l-3 4M16 16l3 4" />
  </svg>
);

export const GemIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M3 9l4-5h10l4 5-11 12L3 9z" />
    <path d="M3 9h18M9 4l-2 5 5 12 5-12-2-5" />
  </svg>
);

export const CirclesIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="6" cy="14" r="1.6" />
    <circle cx="18" cy="14" r="1.6" />
    <circle cx="12" cy="20" r="1.6" />
  </svg>
);

export const WheelIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5V12l6 3.5" />
  </svg>
);

export const HistoryIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-7.6 4.2" />
    <path d="M3 4v5h5M12 8v5l3 2" />
  </svg>
);

export const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);

export const BombIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="11" cy="14" r="7" />
    <path d="M16 9l2-2M18 3l1.5 1.5M20 5.5L22 4" />
  </svg>
);

export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);
