import type {
  AuthSession,
  AuthUser,
  BetHistoryDto,
  BetResultDto,
  GameSummaryDto,
  LedgerEntryDto,
  LoginInput,
  MinesGameStateDto,
  PlaceBetInput,
  SignUpInput,
  StartMinesInput,
  WalletBalance,
} from "@bet-platform/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}) as { message?: string | string[] });
    const message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
    throw new ApiError(message ?? `Erro ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  signUp: (input: SignUpInput) =>
    request<AuthSession>("/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  login: (input: LoginInput) =>
    request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  me: (token: string) => request<AuthUser>("/users/me", {}, token),
  wallet: (token: string) => request<WalletBalance>("/wallet", {}, token),
  ledger: (token: string) => request<LedgerEntryDto[]>("/wallet/ledger", {}, token),
  deposit: (token: string, amount: number) =>
    request<WalletBalance>("/wallet/deposit", { method: "POST", body: JSON.stringify({ amount }) }, token),
  depositPix: (token: string, amount: number) =>
    request<{ orderId: string; status: string }>(
      "/wallet/deposit/pix",
      { method: "POST", body: JSON.stringify({ amount }) },
      token,
    ),
  games: () => request<GameSummaryDto[]>("/games"),
  placeBet: (token: string, input: PlaceBetInput) =>
    request<BetResultDto>("/bets", { method: "POST", body: JSON.stringify(input) }, token),
  myBets: (token: string) => request<BetHistoryDto[]>("/bets/me", {}, token),
  minesStart: (token: string, input: StartMinesInput) =>
    request<MinesGameStateDto>("/games/mines/start", { method: "POST", body: JSON.stringify(input) }, token),
  minesReveal: (token: string, betId: string, cellIndex: number) =>
    request<MinesGameStateDto>(
      `/games/mines/${betId}/reveal`,
      { method: "POST", body: JSON.stringify({ cellIndex }) },
      token,
    ),
  minesCashout: (token: string, betId: string) =>
    request<MinesGameStateDto>(`/games/mines/${betId}/cashout`, { method: "POST" }, token),
};

export { ApiError };
