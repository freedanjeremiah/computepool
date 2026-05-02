"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Button, Card, RowKV } from "@/components/cp/primitives";
import { useInferState } from "@/lib/use-infer-state";

export default function InferStep3() {
  const T = useT();
  const router = useRouter();
  const { state } = useInferState();
  const [ph, setPh] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setPh((p) => p + 1), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Card padding={48}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 28, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 28px" }}>
          Review your request
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RowKV k="Model" v={state.modelName}/>
          <RowKV k="Pool" v="qwen-pool-1 · 2 nodes"/>
          <RowKV k="Budget" v={`${state.budget.toFixed(2)} USDCx`}/>
          <RowKV k="Est. duration" v="~25 seconds"/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>Coalition</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: T.amber, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: T.amber, opacity: 0.5 + 0.5 * Math.sin(ph * 0.3) }}/>
              Forming on-chain…
            </span>
          </div>
        </div>

        <div style={{ marginTop: 28, padding: 20, borderRadius: 10, background: T.surfaceWarm, fontFamily: FONT_BODY, fontSize: 15, color: T.text2, lineHeight: 1.6 }}>
          “{state.prompt}”
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, marginBottom: 10, fontWeight: 500 }}>What happens when you confirm</div>
          {[
            "A coalition forms on-chain",
            "Your budget is wrapped to USDCx",
            "A payment stream opens instantly",
            "You pay only while inference runs",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>
              <span style={{ color: T.primary, fontWeight: 500 }}>{i + 1}.</span> {s}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <Button kind="secondary" onClick={() => router.push("/infer/setup")} style={{ flex: 1 }}>Back</Button>
          <Button kind="primary" onClick={() => router.push("/infer/active")} style={{ flex: 2 }}>Confirm + Pay →</Button>
        </div>
      </Card>
    </div>
  );
}
