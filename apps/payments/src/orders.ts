import { getPagarmeConfig, getPagarmeSecretKey } from "./config.js";

function authHeader(secretKey: string): string {
  return `Basic ${btoa(`${secretKey}:`)}`;
}

export async function getOrder(orderId: string) {
  const { apiBaseUrl } = getPagarmeConfig();
  const secretKey = getPagarmeSecretKey();

  const res = await fetch(`${apiBaseUrl}/orders/${orderId}`, {
    headers: { Authorization: authHeader(secretKey) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Falha ao consultar pedido");
  return data;
}
