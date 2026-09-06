import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Reflete diretamente o model BonusCampaign (packages/database) — falta o
 * CRUD no apps/api (GET/POST/PATCH /admin/bonus-campaigns) para estes
 * campos deixarem de ser somente leitura.
 */
export default function BonusPage() {
  return (
    <AdminShell active="/bonus">
      <h1 className="font-display text-xl font-bold">Bônus</h1>

      <Card className="mt-5 max-w-lg p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Bônus de Boas-vindas</h2>
          <Badge variant="on">Ativo</Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Valor</div>
            <div className="mt-1 font-mono text-lg font-semibold">R$ 50,00</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Tipo</div>
            <div className="mt-1 text-sm font-semibold">Cadastro</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Expiração
            </div>
            <div className="mt-1 text-sm font-semibold">7 dias</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Concedidos
            </div>
            <div className="mt-1 font-mono text-sm font-semibold">1.204</div>
          </div>
        </div>
      </Card>
    </AdminShell>
  );
}
