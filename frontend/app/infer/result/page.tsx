"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Button, Card, RowKV } from "@/components/cp/primitives";
import { useInferState } from "@/lib/use-infer-state";

const FALLBACK_TEXT = `Attention is how a transformer decides what to focus on.

For each token in the input, the model computes three vectors: a query, a key, and a value. The query asks "what am I looking for?" — the keys describe "what each other token offers" — the values are "what gets passed forward."

Token i's output is a weighted sum of every other token's value, where the weights come from how well token i's query matches each token's key.

This means every token can directly attend to every other token, regardless of distance. That's the breakthrough.`;

export default function InferStep5() {
  const T = useT();
  const router = useRouter();
  const { state } = useInferState();
  const breached = !!state.breached;
  const output = state.output ?? FALLBACK_TEXT;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: T.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 18, fontWeight: 600,
        }}>✓</div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: T.text1, letterSpacing: "-0.02em" }}>
            Inference complete
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2, marginTop: 2 }}>
            28.4s · 312 tokens · settled on 0G Galileo
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Card padding={32}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Output</span>
            <Button kind="secondary" onClick={() => navigator.clipboard?.writeText(output)}>Copy</Button>
          </div>
          <div style={{ marginTop: 20, fontFamily: FONT_MONO, fontSize: 15, color: T.text1, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {output}
          </div>
        </Card>

        <Card padding={32}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: T.text1, margin: "0 0 20px" }}>Job receipt</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <RowKV k="Job ID" v="0x4f2a…c01d"/>
            <RowKV k="Model" v={state.modelName}/>
            <RowKV k="Pool" v="qwen-pool-1"/>
            <RowKV k="Duration" v="28.4 seconds"/>
            <RowKV k="Tokens" v="312 output"/>
          </div>
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Payment breakdown</div>
            <RowKV k="node-a (L0–17)" v="0.082 USDCx"/>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>node-b (L18–35)</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: breached ? T.red : T.text1 }}>
                {breached ? (
                  <>
                    <span style={{ marginRight: 6 }}>slashed</span>
                    <span style={{ textDecoration: "line-through", color: T.text3 }}>0.041</span>
                  </>
                ) : "0.041"}
              </span>
            </div>
            <RowKV k="Subtotal" v={breached ? "0.082 USDCx" : "0.123 USDCx"}/>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>Refunded</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: T.primary, fontWeight: 500 }}>
                {(state.budget - (breached ? 0.082 : 0.123)).toFixed(3)} USDCx
              </span>
            </div>
          </div>
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>On-chain audit trail</div>
            {([
              ["Coalition",  "0xabc…f019", "purple" as const],
              ["Stream",     "0xdef…2244", "purple" as const],
              ...(breached ? [["Slash", "0x123…99ab", "red" as const] as const] : []),
              ["Settlement", "0x77c…0a1f", "primary" as const],
            ] as const).map(([label, hash, kind]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 3,
                    background: kind === "purple" ? T.purple : kind === "red" ? T.red : T.primary,
                  }}/>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>{label}</span>
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text1 }}>
                  {hash} <span style={{ color: T.text3 }}>↗</span>
                </span>
              </div>
            ))}
          </div>
          <Button kind="primary" full style={{ marginTop: 20 }} onClick={() => router.push("/infer")}>
            Run another →
          </Button>
        </Card>
      </div>
    </div>
  );
}
