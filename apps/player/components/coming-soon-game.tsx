import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";

/**
 * O game-engine e o endpoint POST /bets já resolvem Mines/Plinko/Roulette
 * de ponta a ponta — falta só a UI interativa de cada um (próximo passo do
 * frontend). Crash é a referência completa da tela de jogo.
 */
export function ComingSoonGame({ name }: { name: string }) {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-md border border-border bg-surface px-6 py-16 text-center">
          <h1 className="font-display text-xl font-bold">{name}</h1>
          <p className="text-sm text-ink-faint">
            Motor do jogo já pronto na API — interface interativa chega em breve.
          </p>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
