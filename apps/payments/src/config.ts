// Configuração lida de variáveis de ambiente — de propósito. Este pacote é
// pensado pra ser usado por VÁRIOS dos seus projetos, e cada um tem sua
// própria chave secreta e seu próprio recipient de plataforma (mesmo que
// today todos apontem pra mesma conta Stone/Pagar.me). Nada de valor real
// fica hardcoded no código-fonte.
//
// ⚠️ ATENÇÃO — teste vs. produção
// O painel de TESTE (sk_test_) e o de PRODUÇÃO (sk_live_) do Pagar.me são
// contas/dados SEPARADOS. Um recipient_id de teste não existe em produção
// e vice-versa. Troque PAGARME_SECRET_KEY e PAGARME_PLATFORM_RECIPIENT_ID
// juntos quando for pra produção — nunca metade de cada ambiente.

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Veja .env.example.`,
    );
  }
  return value;
}

export function getPagarmeConfig() {
  return {
    /** 'test' se a secret key começar com sk_test_, senão 'production'. */
    environment: (process.env.PAGARME_SECRET_KEY ?? "").startsWith("sk_test_")
      ? ("test" as const)
      : ("production" as const),

    /** Recipient da PLATAFORMA — recebe a taxa da plataforma em toda venda
     * com split. Normalmente o mesmo em todas as lojas/vendedores de um
     * mesmo projeto. */
    platformRecipientId: requiredEnv("PAGARME_PLATFORM_RECIPIENT_ID"),

    /** Base URL da API do Pagar.me — não muda entre teste e produção (é a
     * MESMA URL; a chave secreta, sk_test_ vs sk_live_, que define o
     * ambiente). */
    apiBaseUrl: process.env.PAGARME_API_BASE_URL ?? "https://api.pagar.me/core/v5",

    /** Segredo usado pra validar a assinatura HMAC dos webhooks (configurado
     * no dashboard Pagar.me). Vazio só é aceitável em desenvolvimento. */
    webhookSecret: process.env.PAGARME_WEBHOOK_SECRET ?? "",

    /** Porta do servidor HTTP local, quando rodado via server.ts. */
    port: Number(process.env.PORT ?? 3000),
  };
}

/**
 * A chave secreta (PAGARME_SECRET_KEY) NUNCA é armazenada em código-fonte
 * neste pacote — sempre variável de ambiente do backend, ou um cofre de
 * secrets/tabela protegida por RLS acessível só ao backend (nunca exposta
 * a usuários autenticados comuns nem ao frontend).
 *
 * Formato esperado: sk_test_xxxxxxxx (homologação) ou sk_live_xxxxxxxx
 * (produção). Usada como usuário no Basic Auth, com senha vazia:
 *
 *   Authorization: Basic base64(`${PAGARME_SECRET_KEY}:`)
 */
export function getPagarmeSecretKey(): string {
  return requiredEnv("PAGARME_SECRET_KEY");
}
