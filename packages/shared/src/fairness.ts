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
 * Fisher-Yates determinístico: embaralha `items` derivando um sub-hash
 * (SHA-256) por posição a partir do hash da rodada — cada troca tem sua
 * própria entropia de 256 bits, então funciona igual bem para 25 células
 * (Mines) ou um baralho de 52 cartas (Blackjack), sem reaproveitar bytes.
 * Continua 100% determinístico: o mesmo hash sempre produz o mesmo
 * embaralhamento, permitindo conferência provably-fair.
 */
export function seededShuffle<T>(items: T[], hash: string): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const subHash = createHash("sha256").update(`${hash}:${i}`).digest("hex");
    const j = hashToInt(subHash, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
