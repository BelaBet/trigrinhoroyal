// Validação de CPF/CNPJ (dígito verificador), antes de mandar qualquer
// coisa pra API do Pagar.me/Stone — evita criar recebedor com documento
// digitado errado e só descobrir isso pelo erro 400 da API.

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPF(rawCpf: string): boolean {
  const cpf = onlyDigits(rawCpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string): number => {
    let sum = 0;
    let weight = base.length + 1;
    for (const digit of base) {
      sum += Number(digit) * weight;
      weight--;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const digit1 = calcDigit(cpf.slice(0, 9));
  const digit2 = calcDigit(cpf.slice(0, 9) + digit1);
  return cpf === cpf.slice(0, 9) + String(digit1) + String(digit2);
}

export function isValidCNPJ(rawCnpj: string): boolean {
  const cnpj = onlyDigits(rawCnpj);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string): number => {
    const weights = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base
      .split("")
      .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const digit1 = calcDigit(cnpj.slice(0, 12));
  const digit2 = calcDigit(cnpj.slice(0, 12) + digit1);
  return cnpj === cnpj.slice(0, 12) + String(digit1) + String(digit2);
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o tamanho. */
export function isValidDocument(rawDocument: string): boolean {
  const document = onlyDigits(rawDocument);
  if (document.length === 11) return isValidCPF(document);
  if (document.length === 14) return isValidCNPJ(document);
  return false;
}

export class InvalidDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDocumentError";
  }
}

export function assertValidDocument(rawDocument: string, role: string): void {
  if (!isValidDocument(rawDocument)) {
    throw new InvalidDocumentError(`CPF/CNPJ do ${role} é inválido: ${rawDocument}`);
  }
}
