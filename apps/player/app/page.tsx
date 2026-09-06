import Link from "next/link";
import { CrownIcon, GemIcon, CirclesIcon, RocketIcon, WheelIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

const GAMES = [
  { name: "Slots", icon: GemIcon, art: "from-[#241a45] to-[#3a1240]" },
  { name: "Crash", icon: RocketIcon, art: "from-[#3a1240] to-[#7c2d12]" },
  { name: "Mines", icon: GemIcon, art: "from-[#122d1e] to-[#0f3d2e]" },
  { name: "Plinko", icon: CirclesIcon, art: "from-[#241a45] to-[#4c1d95]" },
  { name: "Roulette", icon: WheelIcon, art: "from-[#3a0f16] to-[#7a1224]" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CrownIcon className="h-7 w-7 text-brand-gold" />
          <span className="font-display text-lg font-extrabold tracking-wide">BETCORE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-bold text-ink-muted hover:text-ink">
            Entrar
          </Link>
          <Link href="/cadastro">
            <Button variant="primary">Cadastrar</Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-lg border border-border bg-bg-raise p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(139,92,246,0.3),transparent_55%),radial-gradient(90%_120%_at_0%_100%,rgba(245,180,0,0.14),transparent_60%)]" />
        <div className="relative max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            Bônus de boas-vindas
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-balance">
            Sua diversão em outro nível
          </h1>
          <p className="mt-4 text-ink-muted">
            Jogue Crash, Mines, Plinko e Roleta com prêmios instantâneos. Cadastre-se com nome, e-mail e
            senha — sem burocracia — e comece a jogar em segundos.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/cadastro">
              <Button variant="primary">Criar conta</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Já tenho conta</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-bold">🔥 Jogos em destaque</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {GAMES.map((game) => (
            <div key={game.name} className="overflow-hidden rounded-md border border-border bg-surface">
              <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${game.art}`}>
                <game.icon className="h-8 w-8 text-white/90" />
              </div>
              <div className="px-3 py-2.5 text-sm font-bold">{game.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
