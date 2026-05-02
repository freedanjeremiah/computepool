// EIP-3009 transferWithAuthorization signer + x402 payload encoder.
//
// Mirrors scripts/sign_payment.py. Uses viem to build the EIP-712 typed
// data and sign locally with a private key from localStorage. The header
// is base64(JSON.stringify({x402Version, scheme, network, payload})), which
// is what the orchestrator's parse_payment_header expects.

import { privateKeyToAccount } from "viem/accounts";
import { getWalletClient } from "./wallet";
import type { Address } from "viem";

export type PaymentRequirements = {
  scheme: string;
  network: string;
  maxAmountRequired: string; // micro-USDC
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: { name?: string; version?: string };
};

export type Authorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: `0x${string}`;
};

const TYPES = {
  TransferWithAuthorization: [
    { name: "from",         type: "address" },
    { name: "to",           type: "address" },
    { name: "value",        type: "uint256" },
    { name: "validAfter",   type: "uint256" },
    { name: "validBefore",  type: "uint256" },
    { name: "nonce",        type: "bytes32" },
  ],
} as const;

function randomNonce(): `0x${string}` {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return ("0x" + Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

export async function signX402(args: {
  privateKey: string;
  requirements: PaymentRequirements;
  chainId: number;
  ttlSeconds?: number;
}): Promise<{ header: string; payer: string; nonce: string }> {
  const pk = (args.privateKey.startsWith("0x") ? args.privateKey : `0x${args.privateKey}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const validAfter = "0";
  const validBefore = String(Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? 600));
  const nonce = randomNonce();

  const auth: Authorization = {
    from: account.address,
    to: args.requirements.payTo,
    value: args.requirements.maxAmountRequired,
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await account.signTypedData({
    domain: {
      name: args.requirements.extra?.name ?? "USDC",
      version: args.requirements.extra?.version ?? "2",
      chainId: args.chainId,
      verifyingContract: args.requirements.asset as `0x${string}`,
    },
    types: TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: auth.from as `0x${string}`,
      to: auth.to as `0x${string}`,
      value: BigInt(auth.value),
      validAfter: BigInt(auth.validAfter),
      validBefore: BigInt(auth.validBefore),
      nonce: auth.nonce,
    },
  });

  const payload = {
    x402Version: 1,
    scheme: args.requirements.scheme || "exact",
    network: args.requirements.network,
    payload: { signature, authorization: auth },
  };

  // Browser btoa over UTF-8 JSON.
  const header = typeof btoa !== "undefined"
    ? btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString("base64");

  return { header, payer: account.address, nonce };
}

/**
 * Sign x402 PaymentRequirements via an injected EIP-1193 wallet
 * (MetaMask, etc). Uses viem's WalletClient.signTypedData under the hood.
 */
export async function signX402WithWallet(args: {
  account: string; // 0x...
  requirements: PaymentRequirements;
  chainId: number;
  ttlSeconds?: number;
}): Promise<{ header: string; payer: string; nonce: string }> {
  const account = args.account as Address;
  const validBefore = String(Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? 600));
  const nonce = randomNonce();
  const auth: Authorization = {
    from: account,
    to: args.requirements.payTo,
    value: args.requirements.maxAmountRequired,
    validAfter: "0",
    validBefore,
    nonce,
  };

  const client = getWalletClient();
  const signature = await client.signTypedData({
    account,
    domain: {
      name: args.requirements.extra?.name ?? "USDC",
      version: args.requirements.extra?.version ?? "2",
      chainId: args.chainId,
      verifyingContract: args.requirements.asset as Address,
    },
    types: TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: auth.from as Address,
      to: auth.to as Address,
      value: BigInt(auth.value),
      validAfter: BigInt(auth.validAfter),
      validBefore: BigInt(auth.validBefore),
      nonce: auth.nonce,
    },
  });

  const payload = {
    x402Version: 1,
    scheme: args.requirements.scheme || "exact",
    network: args.requirements.network,
    payload: { signature, authorization: auth },
  };
  const header = typeof btoa !== "undefined"
    ? btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString("base64");
  return { header, payer: account, nonce };
}

/** Decode an X-PAYMENT-RESPONSE header (base64 JSON). */
export function decodePaymentResponse(b64: string): {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string | null;
} {
  try {
    const json = typeof atob !== "undefined"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return { success: false };
  }
}
