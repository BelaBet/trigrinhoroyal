// Cola específica do BetCore por cima do serviço vendorizado — mantém
// server.ts e os demais arquivos o mais próximo possível do upstream
// (stone-split-service). Quando o Pagar.me confirma "order.paid", isso
// avisa o apps/api pra creditar a carteira do jogador (o crédito real só
// acontece aqui, nunca na resposta síncrona do /checkout).

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada. Veja .env.example.`);
  }
  return value;
}

export function getBetCoreConfig() {
  return {
    apiUrl: process.env.BETCORE_API_URL ?? "http://localhost:3333",
    internalSecret: process.env.BETCORE_INTERNAL_SECRET ?? "",
  };
}

export async function notifyBetCoreDepositConfirmed(params: {
  orderId: string;
  status: "paid" | "payment_failed" | "refunded";
}) {
  const { apiUrl, internalSecret } = getBetCoreConfig();
  const res = await fetch(`${apiUrl}/api/payments/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": internalSecret,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`BetCore recusou o callback do depósito (${res.status}): ${body}`);
  }
}
