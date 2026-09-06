import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { GiftIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

const PROMOS = [
  {
    title: "Bônus de boas-vindas",
    description:
      "Cadastre-se e ganhe até R$100 de bônus para jogar — creditado automaticamente na sua carteira.",
    tag: "Ativo",
    art: "from-brand-violet-soft to-surface",
    cta: { label: "Ver carteira", href: "/carteira" },
  },
  {
    title: "Cashback semanal",
    description: "Toda segunda-feira, parte do que você perdeu na semana anterior volta como bônus.",
    tag: "Em breve",
    art: "from-[#1a2440] to-surface",
    cta: null,
  },
  {
    title: "Bônus de recarga",
    description: "Depósitos a partir do segundo ganham um bônus extra sobre o valor depositado.",
    tag: "Em breve",
    art: "from-[#3a2a12] to-surface",
    cta: null,
  },
];

export default function PromocoesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 font-display text-xl font-bold">Promoções</h1>
          <div className="flex flex-col gap-4">
            {PROMOS.map((promo) => (
              <div
                key={promo.title}
                className={`relative overflow-hidden rounded-md border border-border bg-gradient-to-br p-6 ${promo.art}`}
              >
                <div className="flex items-start justify-between">
                  <GiftIcon className="h-6 w-6 text-brand-gold" />
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      promo.tag === "Ativo" ? "bg-state-green-soft text-state-green" : "bg-surface-3 text-ink-faint"
                    }`}
                  >
                    {promo.tag}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-bold">{promo.title}</h2>
                <p className="mt-1 max-w-md text-sm text-ink-muted">{promo.description}</p>
                {promo.cta && (
                  <Link href={promo.cta.href} className="mt-4 inline-block">
                    <Button variant="primary" className="text-xs">
                      {promo.cta.label}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
