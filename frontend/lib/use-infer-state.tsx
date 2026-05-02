"use client";

import * as React from "react";

export type InferState = {
  model: string;
  modelName: string;
  prompt: string;
  budget: number;
  output?: string;
  breached?: boolean;
  txs?: { coalition?: string; stream?: string; slash?: string; settlement?: string };
  durationMs?: number;
  tokens?: number;
  costUsdc?: number;
};

const DEFAULTS: InferState = {
  model: "qwen",
  modelName: "Qwen3-4B-Instruct",
  prompt: "Explain how attention works in transformers, simply.",
  budget: 0.5,
};

const InferCtx = React.createContext<{
  state: InferState;
  setState: (s: InferState) => void;
} | null>(null);

export function InferProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<InferState>(DEFAULTS);
  const value = React.useMemo(() => ({ state, setState }), [state]);
  return <InferCtx.Provider value={value}>{children}</InferCtx.Provider>;
}

export function useInferState() {
  const v = React.useContext(InferCtx);
  if (!v) throw new Error("useInferState must be used inside <InferProvider>");
  return v;
}
