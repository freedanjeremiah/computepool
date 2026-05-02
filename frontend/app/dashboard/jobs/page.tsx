"use client";

import * as React from "react";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Card } from "@/components/cp/primitives";

const COLS = "1.2fr 1fr 1fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr";

export default function DashJobs() {
  const T = useT();
  const jobs = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      id: "0x" + Math.random().toString(16).slice(2, 8) + "…" + Math.random().toString(16).slice(2, 6),
      model: ["Qwen3-4B", "Llama-3.1-8B", "Mistral-7B", "Phi-3-mini"][i % 4],
      pool:  ["qwen-pool-1", "llama-pool-1", "mistral-pool-1", "phi-pool-2"][i % 4],
      dur:   (5 + Math.random() * 40).toFixed(1) + "s",
      cost:  (Math.random() * 0.2).toFixed(4),
      tokens: Math.floor(Math.random() * 400 + 50),
      status: ["complete", "complete", "complete", "degraded", "complete", "complete"][i % 6],
      time:   ["2m ago", "12m ago", "1h ago", "3h ago", "today", "yesterday"][i % 6],
    })),
    [],
  );
  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 24px" }}>Jobs</h1>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: COLS, padding: "14px 22px",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: FONT_BODY, fontSize: 12, color: T.text3, fontWeight: 500,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          <span>Job ID</span><span>Model</span><span>Pool</span><span>Duration</span><span>Cost</span>
          <span>Tokens</span><span>Status</span><span>Time</span>
        </div>
        {jobs.map((j, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: COLS, padding: "14px 22px",
            borderBottom: `1px solid ${T.border}`, alignItems: "center",
          }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text1 }}>{j.id}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text1 }}>{j.model}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text2 }}>{j.pool}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text2 }}>{j.dur}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text1 }}>{j.cost}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text2 }}>{j.tokens}</span>
            <Badge kind={j.status === "complete" ? "primary" : "amber"} label={j.status}/>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3 }}>{j.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
