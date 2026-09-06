// Criação e consulta de recebedores (produtor, co-produtor, afiliado) na
// Stone/Pagar.me. Isso é feito UMA VEZ por pessoa — guarde o recipient_id
// retornado (formato re_xxxxxxxxxxxxxxxx) no seu banco, associado ao
// usuário. É esse ID que entra em calculateHotmartSplit/chargeWithSplit.

import { getPagarmeConfig, getPagarmeSecretKey } from "./config.js";
import { assertValidDocument } from "./document-validator.js";

type BankAccount = {
  bank: string; // código do banco (ex: "260" Nubank, "341" Itaú)
  branchNumber: string; // agência, sem dígito
  accountNumber: string; // conta, sem dígito
  accountCheckDigit: string;
  accountType: "checking" | "savings";
};

export type CreateRecipientInput = {
  type: "individual" | "company";
  name: string; // nome completo (PF) ou razão social (PJ)
  document: string; // CPF ou CNPJ, com ou sem pontuação
  email: string;
  bankAccount: BankAccount;
  /** O ID desse usuário no SEU sistema — recomendado, facilita rastrear. */
  externalCode?: string;
  role?: "produtor" | "co-produtor" | "afiliado";
};

function authHeader(secretKey: string): string {
  return `Basic ${btoa(`${secretKey}:`)}`;
}

export async function createRecipient(input: CreateRecipientInput) {
  const { type, name, document, email, bankAccount, externalCode, role = "produtor" } = input;

  assertValidDocument(document, role);

  const { apiBaseUrl } = getPagarmeConfig();
  const secretKey = getPagarmeSecretKey();

  const registerInformation =
    type === "company"
      ? { type: "corporation", company_name: name, document, email }
      : {
          type: "individual",
          name,
          document,
          email,
          professional_occupation: "Produtor de conteúdo digital",
          monthly_income: 0,
        };

  const payload = {
    code: externalCode,
    register_information: registerInformation,
    default_bank_account: {
      holder_name: name,
      holder_type: type,
      holder_document: document,
      bank: bankAccount.bank,
      branch_number: bankAccount.branchNumber,
      account_number: bankAccount.accountNumber,
      account_check_digit: bankAccount.accountCheckDigit,
      type: bankAccount.accountType,
    },
    transfer_settings: { transfer_enabled: true, transfer_interval: "Daily", transfer_day: 0 },
  };

  const res = await fetch(`${apiBaseUrl}/recipients`, {
    method: "POST",
    headers: { Authorization: authHeader(secretKey), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Falha ao criar recebedor");
  return data; // data.id é o recipient_id (re_...)
}

export async function getRecipient(recipientId: string) {
  const { apiBaseUrl } = getPagarmeConfig();
  const secretKey = getPagarmeSecretKey();

  const res = await fetch(`${apiBaseUrl}/recipients/${recipientId}`, {
    headers: { Authorization: authHeader(secretKey) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Falha ao consultar recebedor");
  return data;
}
