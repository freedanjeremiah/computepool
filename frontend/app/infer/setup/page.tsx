"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Button, Card, RowKV } from "@/components/cp/primitives";
import { useInferState } from "@/lib/use-infer-state";

export default function InferStep2() {
  const T = useT();
  const router = useRouter();
  const { state, setState } = useInferState();
  const [prompt, setPrompt] = React.useState(state.prompt);
  const [budget, setBudget] = React.useState(state.budget);

  const proceed = () => {
    setState({ ...state, prompt, budget });
    router.push("/infer/review");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
      <Card padding={32}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, marginBottom: 10 }}>Your prompt</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Explain how attention works in transformers, simply."
          style={{
            width: "100%", height: 280, padding: 20, borderRadius: 10, resize: "none",
            border: `1px solid ${T.border}`, background: T.surface, color: T.text1,
            fontFamily: FONT_BODY, fontSize: 18, lineHeight: 1.5, outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = T.primary)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 12, color: T.text3 }}>
          <span>{state.modelName} · qwen-pool-1</span>
          <span>{prompt.length} / 2000</span>
        </div>
      </Card>

      <Card padding={32}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2 }}>Budget</div>
        <div style={{ marginTop: 18, fontFamily: FONT_DISPLAY, fontSize: 64, fontWeight: 600, color: T.text1, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {budget.toFixed(2)}
          <span style={{ fontSize: 22, color: T.text2, marginLeft: 10, fontWeight: 500 }}>USDCx</span>
        </div>
        <input type="range" min="0.10" max="5.00" step="0.01" value={budget}
          onChange={(e) => setBudget(parseFloat(e.target.value))}
          style={{ width: "100%", marginTop: 24, accentColor: T.primary }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 11, color: T.text3 }}>
          <span>0.10</span><span>5.00</span>
        </div>
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <RowKV k="Est. duration" v={`~${Math.round(budget * 50)} seconds`}/>
          <RowKV k="Est. tokens" v={`~${Math.round(budget * 550)} output`}/>
          <RowKV k="Wallet balance" v="2.480 USDCx"/>
        </div>
        <div style={{ marginTop: 18, fontFamily: FONT_BODY, fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
          Charged per second. Unused budget is returned the moment inference completes.
        </div>
        <Button kind="primary" full disabled={!prompt}
          onClick={proceed}
          style={{ marginTop: 24, padding: "14px 24px" }}>
          Continue →
        </Button>
      </Card>
    </div>
  );
}
