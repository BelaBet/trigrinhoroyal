# @bet-platform/payments

Vendorizado de [BelaBet/vc](https://github.com/BelaBet/vc) (stone-split-service) —
integração Stone/Pagar.me com split de pagamento no modelo Hotmart (taxa
"por dentro": produtor/co-produtor/afiliado dividem o líquido após a taxa
da plataforma).

Todo o `src/` é idêntico ao upstream, exceto:

- `server.ts` — o handler do webhook chama `notifyBetCoreDepositConfirmed`
  em vez de só logar no console.
- `betcore-callback.ts` — novo arquivo, avisa o `apps/api` (`POST
  /api/payments/webhook`) quando um pedido é pago/falha/estornado.

## Como o BetCore usa isso

```
JOGADOR                apps/api              apps/payments           Pagar.me
   │  POST /wallet/deposit/pix                  │                       │
   ├──────────────────────►│                    │                       │
   │                       │  POST /checkout    │                       │
   │                       ├───────────────────►│  POST /orders         │
   │                       │                    ├──────────────────────►│
   │                       │◄───────────────────┤  (orderId, QR code)   │
   │◄──────────────────────┤                    │                       │
   │  (paga o PIX)         │                    │                       │
   │                       │                    │   webhook order.paid  │
   │                       │  POST /payments/   │◄──────────────────────┤
   │                       │       webhook      │                       │
   │                       │◄───────────────────┤                       │
   │            credita a carteira + comissão do afiliado (se houver)   │
```

`BETCORE_PRODUCER_RECIPIENT_ID` é o recipient do BetCore em si (recebe o
depósito líquido). `PAGARME_PLATFORM_RECIPIENT_ID` é a conta que cobra a
taxa de 9,9%+R$2,49 (ou 20% em microtransações) — compartilhada entre
todos os seus projetos, não só o BetCore.

## Rodando

```bash
cp .env.example ../../.env   # ou preencha as chaves no .env raiz do monorepo
pnpm --filter @bet-platform/payments build
pnpm --filter @bet-platform/payments start   # sobe em :3334
```

Sem `PAGARME_SECRET_KEY`/`PAGARME_PLATFORM_RECIPIENT_ID`/
`BETCORE_PRODUCER_RECIPIENT_ID` reais, os endpoints de checkout falham —
o depósito simulado (`POST /wallet/deposit` no apps/api) continua sendo o
caminho usado no ambiente de teste.
