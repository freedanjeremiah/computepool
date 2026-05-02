"use client";

import * as React from "react";
import { useT, FONT_DISPLAY } from "@/components/cp/theme";
import { Card } from "@/components/cp/primitives";
import { Stat, Sparkline } from "@/components/cp/dashboard-bits";

export default function DashPayments() {
  const T = useT();
  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 24px" }}>Payments</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Stat label="Today" value="2.41 USDCx"/>
        <Stat label="7 days" value="18.74 USDCx"/>
        <Stat label="30 days" value="84.22 USDCx"/>
        <Stat label="All time" value="412.80 USDCx"/>
      </div>
      <Card padding={32}>
        <Sparkline/>
      </Card>
    </div>
  );
}
