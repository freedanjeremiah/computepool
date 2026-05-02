"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Button } from "@/components/cp/primitives";
import { useInferState } from "@/lib/use-infer-state";

const MODELS = [
  { id: "qwen", name: "Qwen3-4B-Instruct", params: "4B parameters", pools: 2, latency: "11 tok/s", price: "0.02" },
  { id: "llama", name: "Llama-3.1-8B", params: "8B parameters", pools: 1, latency: "8 tok/s", price: "0.04" },
  { id: "mistral", name: "Mistral-7B", params: "7B parameters", pools: 1, latency: "9 tok/s", price: "0.03" },
];

export default function InferStep1() {
  const T = useT();
  const router = useRouter();
  const { state, setState } = useInferState();

  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 40, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 8px", textAlign: "center" }}>
        Choose a model
      </h1>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: T.text2, textAlign: "center", margin: "0 0 40px" }}>
        Each pool is a coalition of operators running the model in shards.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {MODELS.map((m) => {
          const sel = state.model === m.id;
          return (
            <div key={m.id}
              onClick={() => setState({ ...state, model: m.id, modelName: m.name })}
              style={{
                background: sel ? T.primaryLight : T.surface,
                border: sel ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                borderRadius: 16, padding: 28, cursor: "pointer",
                transition: "all 200ms ease",
                transform: sel ? "translateY(-2px)" : "none",
                boxShadow: sel ? `0 8px 24px ${T.primary}22` : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: T.text1 }}>{m.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2, marginTop: 4 }}>{m.params}</div>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                {([
                  ["Pools", m.pools],
                  ["Latency", m.latency],
                  ["Price", `${m.price} USDCx`],
                ] as const).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, whiteSpace: "nowrap" }}>{k}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text1, fontWeight: 500, whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500, color: sel ? T.primary : T.text2 }}>
                {sel ? "✓ Selected" : "Select →"}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <Button kind="primary" disabled={!state.model}
          onClick={() => router.push("/infer/setup")}
          style={{ padding: "12px 32px" }}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
