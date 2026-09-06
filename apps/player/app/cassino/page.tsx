import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";

export default function CassinoPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-md border border-border bg-surface px-6 py-16 text-center">
          <h1 className="font-display text-xl font-bold">Cassino</h1>
          <p className="text-sm text-ink-faint">
            Catálogo de slots e provedores chega em breve — por enquanto, jogue Crash, Mines, Plinko
            ou Roleta no menu ao lado.
          </p>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
