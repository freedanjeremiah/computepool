// SSE client for /pools/{name}/infer/stream. Yields token / done / settle / error events.

import { BASE } from "./api";
import type { PaymentRequirements } from "./sign-payment";

export type InferEvent =
  | { event: "token"; request_id: string; seq: number; token_id: number; delta: string }
  | { event: "done"; request_id: string; text: string; tokens: number; elapsed_s: number; tokens_per_sec: number; cost_usdc?: number; pool?: string; entry_node?: string; exit_node?: string; timings?: Record<string, number> }
  | { event: "settle"; request_id?: string; success: boolean; transaction?: string; network?: string; payer?: string; errorReason?: string | null }
  | { event: "error"; request_id?: string; error: string };

export type StreamArgs = {
  poolName: string;
  prompt: string;
  maxTokens: number;
  temperature?: number;
  apiKey: string;
  xPayment: string;
  signal?: AbortSignal;
};

export async function* streamInfer(args: StreamArgs): AsyncGenerator<InferEvent> {
  const url = `${BASE}/pools/${encodeURIComponent(args.poolName)}/infer/stream`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": args.apiKey,
      "X-PAYMENT": args.xPayment,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      max_tokens: args.maxTokens,
      temperature: args.temperature ?? 0.0,
    }),
    signal: args.signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`infer/stream HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        yield JSON.parse(payload) as InferEvent;
      } catch {
        // ignore malformed
      }
    }
  }
}

/**
 * POST /pools/{name}/infer/stream without X-PAYMENT and read the 402 challenge.
 * Returns the first PaymentRequirements entry from accepts[]; throws if the
 * server didn't reply 402 or didn't include any accepts.
 */
export async function fetchPaymentRequirements(args: {
  poolName: string;
  prompt: string;
  maxTokens: number;
  apiKey: string;
  temperature?: number;
}): Promise<PaymentRequirements> {
  const url = `${BASE}/pools/${encodeURIComponent(args.poolName)}/infer/stream`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": args.apiKey,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      max_tokens: args.maxTokens,
      temperature: args.temperature ?? 0.0,
    }),
  });
  if (res.status !== 402) {
    const txt = await res.text().catch(() => "");
    throw new Error(`expected 402 challenge, got ${res.status}: ${txt.slice(0, 300)}`);
  }
  const body = await res.json();
  const accepts = Array.isArray(body?.accepts) ? body.accepts : [];
  if (!accepts.length) throw new Error("402 had no accepts[] entries");
  return accepts[0] as PaymentRequirements;
}

