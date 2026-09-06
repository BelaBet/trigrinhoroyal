import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Primitivas provably-fair compartilhadas pelos quatro game-engines.
 * Cada rodada publica o serverSeedHash ANTES de aceitar apostas; o
 * serverSeed só é revelado depois do resultado, permitindo ao jogador
 * conferir que o resultado não foi alterado.
 */

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

/** Hash determinístico da rodada: HMAC-SHA256(serverSeed, clientSeed:nonce). */
export function deriveRoundHash(serverSeed: string, clientSeed: string, nonce: number): string {
  return createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
}

/** Converte um hash hex em float determinístico no intervalo [0, 1). */
export function hashToFloat(hash: string, offset = 0): number {
  const slice = hash.slice(offset, offset + 8);
  return parseInt(slice, 16) / 0xffffffff;
}

/** Converte um hash hex em inteiro determinístico no intervalo [0, max). */
export function hashToInt(hash: string, max: number, offset = 0): number {
  return Math.floor(hashToFloat(hash, offset) * max);
}

/**
 * Fisher-Yates determinístico: embaralha `items` usando bytes sucessivos do
 * hash como fonte de aleatoriedade (usado pelo Mines para posicionar minas).
 */
export function seededShuffle<T>(items: T[], hash: string): T[] {
  const result = [...items];
  let cursor = 0;
  for (let i = result.length - 1; i > 0; i--) {
    const j = hashToInt(hash, i + 1, (cursor * 8) % (hash.length - 8));
    cursor++;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
