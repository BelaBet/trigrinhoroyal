"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { api } from "@/lib/api";
import type { LedgerEntryDto } from "@bet-platform/shared";

const ENTRY_LABEL: Record<LedgerEntryDto["type"], string> = {
  DEPOSIT: "Depósito",
  BET: "Aposta",
  WIN: "Prêmio",
  LOSS: "Resultado",
  REFUND: "Reembolso",
  WITHDRAWAL: "Saque",
  BONUS: "Bônus",
  BONUS_CONVERSION: "Conversão de bônus",
  ADMIN_ADJUSTMENT: "Ajuste administrativo",
};

function CarteiraContent() {
  const { token } = useAuth();
  const { balance, refresh } = useWallet();
  const [ledger, setLedger] = useState<LedgerEntryDto[] | null>(null);
  const [depositing, setDepositing] = useState(false);
  const [pixStatus, setPixStatus] = useState<string | null>(null);

  async function loadLedger() {
    if (!token) return;
    const entries = await api.ledger(token);
    setLedger(entries);
  }

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDeposit(amount: number) {
    if (!token) return;
    setDepositing(true);
    try {
      await api.deposit(token, amount);
      await Promise.all([refresh(), loadLedger()]);
    } finally {
      setDepositing(false);
    }
  }

  async function handleDepositPix(amount: number) {
    if (!token) return;
    setPixStatus(null);
    setDepositing(true);
    try {
      const result = await api.depositPix(token, amount);
      setPixStatus(`Pedido ${result.orderId} criado (${result.status}) — pague o PIX para confirmar.`);
    } catch (err) {
      setPixStatus(err instanceof Error ? err.message : "Pagamento real indisponível no momento.");
    } finally {
      setDepositing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold">Minha Carteira</h1>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-surface-2 to-surface p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Saldo real</div>
          <div className="mt-1.5 font-mono text-xl font-semibold">R$ {balance?.realBalance ?? "0,00"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Saldo bloqueado
          </div>
          <div className="mt-1.5 font-mono text-xl font-semibold">
            R$ {balance?.blockedBalance ?? "0,00"}
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-brand-violet-soft to-surface p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Saldo bônus</div>
          <div className="mt-1.5 font-mono text-xl font-semibold">R$ {balance?.bonusBalance ?? "0,00"}</div>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {[50, 100, 200].map((amount) => (
          <Button
            key={amount}
            variant="primary"
            disabled={depositing}
            onClick={() => handleDeposit(amount)}
          >
            Depositar R$ {amount}
          </Button>
        ))}
        <Button variant="secondary" disabled={depositing} onClick={() => handleDepositPix(100)}>
          Depositar R$ 100 via PIX
        </Button>
        <Button variant="secondary" disabled>
          Sacar
        </Button>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Botões dourados: depósito simulado (ambiente de teste). "Via PIX": pagamento real
        Stone/Pagar.me — exige credenciais configuradas no backend.
      </p>
      {pixStatus && <p className="mt-2 text-xs font-semibold text-brand-gold">{pixStatus}</p>}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">Últimas movimentações</h2>
      </div>
      <div className="mt-3 overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface text-left text-[11px] uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-bold">Tipo</th>
              <th className="px-4 py-3 font-bold">Data</th>
              <th className="px-4 py-3 text-right font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(ledger ?? []).map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="px-4 py-3 text-sm">{ENTRY_LABEL[entry.type]}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {new Date(entry.createdAt).toLocaleString("pt-BR")}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm font-semibold ${
                    Number(entry.amount) >= 0 ? "text-state-green" : "text-state-red"
                  }`}
                >
                  {Number(entry.amount) >= 0 ? "+" : "−"} R$ {Math.abs(Number(entry.amount)).toFixed(2)}
                </td>
              </tr>
            ))}
            {ledger !== null && ledger.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-ink-faint">
                  Nenhuma movimentação ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CarteiraPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <CarteiraContent />
      </AppShell>
    </ProtectedRoute>
  );
}
