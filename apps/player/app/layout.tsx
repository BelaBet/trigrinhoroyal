import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { WalletProvider } from "@/lib/wallet-context";

export const metadata: Metadata = {
  title: "BetCore",
  description: "Sua diversão em outro nível.",
};

/**
 * As fontes são carregadas via <link> (fetch no navegador do usuário), não
 * via next/font/google — isso evita que o build do Next dependa de rede
 * para baixar fontes, o que costuma falhar atrás de proxies corporativos/CI.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="bg-bg font-body text-ink antialiased">
        <AuthProvider>
          <WalletProvider>{children}</WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
