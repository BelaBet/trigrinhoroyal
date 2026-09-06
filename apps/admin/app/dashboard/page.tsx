import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";

/**
 * Dados estáticos por enquanto — o módulo de Analytics (player_metrics,
 * game_metrics, daily_metrics, revenue_metrics) já existe no schema, falta
 * o endpoint de agregação no apps/api para substituir estes números fixos.
 */
const STATS = [
  { label: "Usuários", value: "82.431" },
  { label: "Turnover", value: "R$42,8M" },
  { label: "GGR", value: "R$3,4M" },
  { label: "Depósitos", value: "R$48,2M" },
];

const TOP_GAMES = [
  { name: "Slot A", share: 28 },
  { name: "Crash", share: 22 },
  { name: "Mines", share: 18 },
  { name: "Plinko", share: 14 },
  { name: "Roulette", share: 10 },
];

export default function DashboardPage() {
  return (
    <AdminShell active="/dashboard">
      <h1 className="font-display text-xl font-bold">Dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {stat.label}
            </div>
            <div className="mt-1.5 font-mono text-lg font-semibold">{stat.value}</div>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-sm font-bold">Top games (GGR share)</h2>
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse">
          <tbody>
            {TOP_GAMES.map((game, i) => (
              <tr key={game.name} className={i > 0 ? "border-t border-border" : ""}>
                <td className="px-4 py-3 text-sm font-semibold">{game.name}</td>
                <td className="px-4 py-3">
                  <div className="h-1.5 w-full max-w-xs rounded-full bg-surface-3">
                    <div
                      className="h-1.5 rounded-full bg-brand-gold"
                      style={{ width: `${game.share * 3}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm">{game.share}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
