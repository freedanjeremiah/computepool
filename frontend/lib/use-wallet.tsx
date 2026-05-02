"use client";

import * as React from "react";
import {
  silentAccounts, connectInjected, currentChainId, hasInjected,
  ensureChain, ZERO_G_GALILEO, onProviderEvent,
} from "./wallet";
import { loadChainId } from "./auth-store";

export type WalletState = {
  available: boolean;
  address: string | null;
  chainId: number | null;
  expectedChainId: number;
  rightChain: boolean;
};

type Ctx = {
  state: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
  error: string | null;
  busy: boolean;
};

const WalletCtx = React.createContext<Ctx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = React.useState(false);
  const [address, setAddress] = React.useState<string | null>(null);
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [expectedChainId, setExpectedChainId] = React.useState<number>(ZERO_G_GALILEO.chainId);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Initial probe + silent reconnect.
  React.useEffect(() => {
    setAvailable(hasInjected());
    setExpectedChainId(loadChainId());
    void (async () => {
      const accs = await silentAccounts();
      if (accs.length) setAddress(accs[0]);
      const cid = await currentChainId();
      setChainId(cid);
    })();
  }, []);

  // Subscribe to provider events.
  React.useEffect(() => {
    const offAcc = onProviderEvent("accountsChanged", (...args) => {
      const accs = args[0] as string[] | undefined;
      setAddress(accs && accs.length ? accs[0] : null);
    });
    const offChain = onProviderEvent("chainChanged", (...args) => {
      const hex = args[0] as string;
      setChainId(parseInt(hex, 16));
    });
    const offDisc = onProviderEvent("disconnect", () => setAddress(null));
    return () => { offAcc(); offChain(); offDisc(); };
  }, []);

  const connect = React.useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const a = await connectInjected();
      setAddress(a);
      const cid = await currentChainId();
      setChainId(cid);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const switchChain = React.useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await ensureChain({ ...ZERO_G_GALILEO, chainId: expectedChainId });
      const cid = await currentChainId();
      setChainId(cid);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [expectedChainId]);

  const disconnect = React.useCallback(() => {
    setAddress(null);
    // EIP-1193 has no programmatic disconnect; this just forgets locally.
  }, []);

  const state: WalletState = {
    available,
    address,
    chainId,
    expectedChainId,
    rightChain: chainId !== null && chainId === expectedChainId,
  };

  const value = React.useMemo<Ctx>(() => ({
    state, connect, disconnect, switchChain, error, busy,
  }), [state, connect, disconnect, switchChain, error, busy]);

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet(): Ctx {
  const v = React.useContext(WalletCtx);
  if (!v) throw new Error("useWallet must be used inside <WalletProvider>");
  return v;
}
