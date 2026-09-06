import type { Wallet } from "@bet-platform/database";
import type { WalletBalance } from "@bet-platform/shared";

export function toWalletBalance(wallet: Wallet): WalletBalance {
  return {
    realBalance: wallet.realBalance.toFixed(2),
    blockedBalance: wallet.blockedBalance.toFixed(2),
    bonusBalance: wallet.bonusBalance.toFixed(2),
    currency: wallet.currency,
  };
}
