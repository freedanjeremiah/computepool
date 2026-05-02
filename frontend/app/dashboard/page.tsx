"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY } from "@/components/cp/theme";
import { Badge, Button, Card, Ticker } from "@/components/cp/primitives";
import { Stat, LiveJob, EventRow, Sparkline } from "@/components/cp/dashboard-bits";
import { NetworkGraph } from "@/components/cp/network-graph";

type Event = { kind: "primary" | "purple" | "red" | "amber"; label: string; meta: string; t: string };

const INITIAL_EVENTS: Event[] = [
  { kind: "primary", label: "Stream started",      meta: "job-0x4f · qwen-pool-1",            t: "2m ago" },
  { kind: "purple",  label: "Coalition activated", meta: "qwen-pool-1 · 0xabc…f019",          t: "2m ago" },
  { kind: "primary", label: "Inference complete",  meta: "job-0x39 · 0.082 USDCx",            t: "8m ago" },
  { kind: "purple",  label: "Node registered",     meta: "node-g · 0xfff…2244",               t: "24m ago" },
  { kind: "primary", label: "Pool initialized",    meta: "phi-pool-2",                        t: "1h ago" },
];

export default function DashOverview() {
  const T = useT();
  const router = useRouter();
  const [streamed, setStreamed] = React.useState(0.24);
  const [breached, setBreached] = React.useState(false);
  const [events, setEvents] = React.useState<Event[]>(INITIAL_EVENTS);

  React.useEffect(() => {
    const id = setInterval(() => setStreamed((s) => s + 0.0084), 2000);
    return () => clearInterval(id);
  }, []);
  React.useEffect(() => {
    const id = setTimeout(() => {
      setBreached(true);
      setEvents((e) => [{ kind: "red", label: "Breach slashed", meta: "node-b · 0x123…99ab", t: "now" }, ...e]);
    }, 9000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: 0 }}>
            Network overview
          </h1>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2, marginTop: 4 }}>
            Live state of all pools and operators you manage.
          </div>
        </div>
        <Button kind="primary" onClick={() => router.push("/infer")}>+ New inference</Button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.32fr 1fr", gap: 20 }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Network</span>
            <Badge kind="primary" label="3 jobs streaming"/>
          </div>
          <NetworkGraph width={760} height={520} nodeCount={7} breachId={breached ? 4 : null} breachAt={0}/>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Stat label="Active jobs" value="3"/>
            <Stat label="USDCx/hr streaming" value={<Ticker value={streamed} decimals={4}/>}/>
            <Stat label="Healthy nodes" value={breached ? "6 / 7" : "7 / 7"}/>
            <Stat label="Avg latency" value="11.2 tok/s"/>
          </div>

          <Card padding={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Live jobs</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text3 }}>3 active</span>
            </div>
            <LiveJob model="Qwen3-4B" pool="qwen-pool-1" pct={0.64} elapsed="28.4s" breached={breached}/>
            <div style={{ borderTop: `1px solid ${T.border}` }}/>
            <LiveJob model="Llama-3.1-8B" pool="llama-pool-1" pct={0.31} elapsed="14.1s" breached={false} small/>
          </Card>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.32fr 1fr", gap: 20, marginTop: 20 }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Earnings, last 24h</span>
          </div>
          <div style={{ padding: 24 }}>
            <Sparkline/>
          </div>
        </Card>

        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Event feed</span>
          </div>
          <div style={{ maxHeight: 280, overflow: "auto" }}>
            {events.map((e, i) => <EventRow key={i} {...e}/>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
