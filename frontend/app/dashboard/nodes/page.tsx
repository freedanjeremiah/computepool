"use client";

import * as React from "react";
import { useT, FONT_DISPLAY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Card } from "@/components/cp/primitives";

export default function DashNodes() {
  const T = useT();
  const nodes = React.useMemo(
    () => ["a", "b", "c", "d", "e", "f", "g"].map((c, i) => ({
      id: "node-" + c,
      hex: `0x${c.repeat(3)}…${(1234 + i).toString(16)}`,
      state: i === 4 ? "BREACHED" : i === 6 ? "OFFLINE" : "HEALTHY",
      rep: (0.78 + Math.random() * 0.2).toFixed(2),
      earned: (Math.random() * 4).toFixed(3),
    })),
    [],
  );
  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 24px" }}>Nodes</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {nodes.map((n) => (
          <Card key={n.id} padding={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: T.text1 }}>{n.id}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text3, marginTop: 2 }}>{n.hex}</div>
              </div>
              <Badge
                kind={n.state === "HEALTHY" ? "primary" : n.state === "BREACHED" ? "red" : "offline"}
                label={n.state.toLowerCase()}
              />
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Reputation</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: T.text1, fontWeight: 500, marginTop: 4 }}>{n.rep}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Earned 7d</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: T.text1, fontWeight: 500, marginTop: 4 }}>{n.earned}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
