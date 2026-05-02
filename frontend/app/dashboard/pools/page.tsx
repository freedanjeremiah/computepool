"use client";

import * as React from "react";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Card } from "@/components/cp/primitives";

const POOLS = [
  { id: "qwen-pool-1",     model: "Qwen3-4B",     state: "ACTIVE",    nodes: 2, price: "0.02", earnings: "1.42" },
  { id: "llama-pool-1",    model: "Llama-3.1-8B", state: "ACTIVE",    nodes: 2, price: "0.04", earnings: "2.18" },
  { id: "mistral-pool-1",  model: "Mistral-7B",   state: "PROPOSED",  nodes: 2, price: "0.03", earnings: "0.00" },
  { id: "phi-pool-2",      model: "Phi-3-mini",   state: "DISSOLVED", nodes: 0, price: "—",    earnings: "4.41" },
];

const COLS = "1.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr";

export default function DashPools() {
  const T = useT();
  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 24px" }}>Pools</h1>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: COLS, padding: "14px 22px",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: FONT_BODY, fontSize: 12, color: T.text3, fontWeight: 500,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          <span>Pool</span><span>Model</span><span>State</span><span>Nodes</span><span>Price</span>
          <span style={{ textAlign: "right" }}>Earnings</span>
        </div>
        {POOLS.map((p) => (
          <div key={p.id}
            style={{
              display: "grid", gridTemplateColumns: COLS, padding: "18px 22px",
              borderBottom: `1px solid ${T.border}`, alignItems: "center", cursor: "pointer",
            }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text1 }}>{p.id}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text1 }}>{p.model}</span>
            <Badge kind={p.state === "ACTIVE" ? "primary" : p.state === "PROPOSED" ? "amber" : "offline"} label={p.state}/>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text2 }}>{p.nodes}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text2 }}>{p.price} USDCx</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.text1, textAlign: "right" }}>{p.earnings}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
