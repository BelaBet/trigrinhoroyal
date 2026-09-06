import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { GiftIcon } from "@/components/icons";

export default function PromocoesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 font-display text-xl font-bold">Promoções</h1>
          <div className="relative overflow-hidden rounded-md border border-border p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_160%_at_100%_0%,rgba(245,180,0,0.18),transparent_60%),linear-gradient(120deg,#241a45,#3a1240)]" />
            <div className="relative">
              <GiftIcon className="h-6 w-6 text-brand-gold" />
              <h2 className="mt-3 font-display text-lg font-bold">Bônus de boas-vindas</h2>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                Deposite pela primeira vez e ganhe até R$100 de bônus para jogar. O valor é creditado
                automaticamente no seu cadastro.
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-ink-faint">Mais promoções chegam em breve.</p>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
