// Browser wallet (MetaMask / any EIP-1193 injected provider) helpers using
// viem directly. No wagmi — keeps the bundle small and dodges the
// react@19 peer-dep ladder.

import { createWalletClient, custom, type Address, type WalletClient } from "viem";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (ev: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (ev: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function hasInjected(): boolean {
  return getEthereum() !== null;
}

/** Return the currently authorized account if any (no prompt). */
export async function silentAccounts(): Promise<Address[]> {
  const eth = getEthereum();
  if (!eth) return [];
  try {
    const accs = (await eth.request({ method: "eth_accounts" })) as Address[];
    return accs ?? [];
  } catch {
    return [];
  }
}

/** Prompt the user to connect. Returns the chosen address. */
export async function connectInjected(): Promise<Address> {
  const eth = getEthereum();
  if (!eth) throw new Error("No injected wallet detected. Install MetaMask or another EIP-1193 wallet.");
  const accs = (await eth.request({ method: "eth_requestAccounts" })) as Address[];
  if (!accs?.length) throw new Error("Wallet returned no accounts.");
  return accs[0];
}

export async function currentChainId(): Promise<number | null> {
  const eth = getEthereum();
  if (!eth) return null;
  try {
    const hex = (await eth.request({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  } catch {
    return null;
  }
}

export type ChainSpec = {
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls?: string[];
};

export const ZERO_G_GALILEO: ChainSpec = {
  chainId: 16602,
  chainName: "0G Galileo Testnet",
  rpcUrls: ["https://evmrpc-testnet.0g.ai"],
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
};

const ERR_CHAIN_NOT_ADDED = 4902;

export async function ensureChain(spec: ChainSpec): Promise<void> {
  const eth = getEthereum();
  if (!eth) throw new Error("No injected wallet detected.");
  const hexId = "0x" + spec.chainId.toString(16);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    return;
  } catch (e) {
    const code = (e as { code?: number }).code;
    if (code !== ERR_CHAIN_NOT_ADDED) throw e;
  }
  await eth.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: hexId,
      chainName: spec.chainName,
      rpcUrls: spec.rpcUrls,
      nativeCurrency: spec.nativeCurrency,
      blockExplorerUrls: spec.blockExplorerUrls,
    }],
  });
}

export function getWalletClient(): WalletClient {
  const eth = getEthereum();
  if (!eth) throw new Error("No injected wallet detected.");
  return createWalletClient({ transport: custom(eth) });
}

export type ProviderEvent = "accountsChanged" | "chainChanged" | "disconnect";

export function onProviderEvent(ev: ProviderEvent, cb: (...args: unknown[]) => void): () => void {
  const eth = getEthereum();
  if (!eth?.on || !eth?.removeListener) return () => {};
  eth.on(ev, cb);
  return () => eth.removeListener?.(ev, cb);
}
