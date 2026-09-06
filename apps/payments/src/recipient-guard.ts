// Proteção contra configuração errada: o recipient de um produtor,
// co-produtor ou afiliado nunca pode ser igual ao recipient da
// plataforma — se fosse, essa "perna" do split cairia na conta errada.

const RECIPIENT_FORMAT = /^re_[a-z0-9]{20,}$/i;

export class PlatformRecipientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformRecipientError";
  }
}

export function isPlatformRecipient(recipientId: string, platformRecipientId: string): boolean {
  return recipientId.trim() === platformRecipientId;
}

/** Lança PlatformRecipientError se o recipient for inválido ou igual ao
 * da plataforma. Chame para CADA recipient (produtor, co-produtor,
 * afiliado) antes de montar o split de qualquer cobrança. */
export function assertParticipantRecipientId(
  recipientId: string,
  platformRecipientId: string,
  role: "produtor" | "co-produtor" | "afiliado" = "produtor",
): void {
  if (!RECIPIENT_FORMAT.test(recipientId)) {
    throw new PlatformRecipientError(`recipient do ${role} com formato inválido`);
  }
  if (recipientId === platformRecipientId) {
    throw new PlatformRecipientError(`recipient do ${role} não pode ser igual ao da plataforma`);
  }
}

/** Alias mantido por compatibilidade com código que já chamava a versão
 * anterior (só produtor/vendedor). */
export const assertSellerRecipientId = assertParticipantRecipientId;
