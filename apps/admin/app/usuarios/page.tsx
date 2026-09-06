import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder — falta o endpoint GET /admin/users (paginado) no apps/api.
 * O schema (users, wallets) já suporta essa listagem sem mudanças.
 */
const USERS = [
  { name: "Ana Souza", email: "ana@email.com", saldo: "R$ 125,00", status: "ACTIVE" as const },
  { name: "Bruno Lima", email: "bruno@email.com", saldo: "R$ 40,00", status: "ACTIVE" as const },
  { name: "Carla Nogueira", email: "carla@email.com", saldo: "R$ 0,00", status: "SUSPENDED" as const },
];

export default function UsuariosPage() {
  return (
    <AdminShell active="/usuarios">
      <h1 className="font-display text-xl font-bold">Usuários</h1>
      <div className="mt-5 overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-bold">Nome</th>
              <th className="px-4 py-3 font-bold">E-mail</th>
              <th className="px-4 py-3 font-bold">Saldo</th>
              <th className="px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((user) => (
              <tr key={user.email} className="border-t border-border">
                <td className="px-4 py-3 text-sm font-semibold">{user.name}</td>
                <td className="px-4 py-3 text-sm text-ink-muted">{user.email}</td>
                <td className="px-4 py-3 font-mono text-sm">{user.saldo}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "ACTIVE" ? "on" : "off"}>
                    {user.status === "ACTIVE" ? "Ativo" : "Suspenso"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
