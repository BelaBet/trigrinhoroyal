"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { api } from "./api";
import type { WalletBalance } from "@bet-platform/shared";

interface WalletContextValue {
  balance: WalletBalance | null;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  balance: null,
  refresh: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setBalance(null);
      return;
    }
    const data = await api.wallet(token);
    setBalance(data);
  }, [token]);

  useEffect(() => {
    refresh().catch(() => setBalance(null));
  }, [refresh]);

  return <WalletContext.Provider value={{ balance, refresh }}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
