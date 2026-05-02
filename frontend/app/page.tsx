"use client";

import * as React from "react";
import Link from "next/link";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card } from "@/components/cp/primitives";
import { TopNav, Footer } from "@/components/cp/top-nav";
import { NetworkGraph } from "@/components/cp/network-graph";

export default function LandingPage() {
  const T = useT();
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <TopNav active="landing"/>

      {/* Hero */}
      <section style={{ padding: "80px 64px 40px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 760px", gap: 64, alignItems: "center" }}>
          <div>
            <Badge kind="primary" label="Live on 0G Galileo · 4 pools active" style={{ marginBottom: 24 }}/>
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 72, lineHeight: 1.05,
              color: T.text1, letterSpacing: "-0.03em", margin: "0 0 24px",
            }}>
              A live atlas<br/>of decentralized<br/>compute.
            </h1>
            <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: T.text2, lineHeight: 1.5, margin: "0 0 36px", maxWidth: 540 }}>
              Run inference on a network of independent operators. Pay by the second with on-chain streaming payments. Watch every token get computed, in real time.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/infer" style={{ textDecoration: "none" }}>
                <Button kind="primary">Run inference →</Button>
              </Link>
              <Link href="/dashboard" style={{ textDecoration: "none" }}>
                <Button kind="secondary">Open dashboard</Button>
              </Link>
            </div>

            <div style={{ display: "flex", gap: 48, marginTop: 64 }}>
              {([
                ["Active nodes", "24"],
                ["Avg latency", "11.2 tok/s"],
                ["Settled today", "8,402 USDCx"],
              ] as const).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 28, color: T.text1, marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", height: 560 }}>
            <Card padding={0} style={{ overflow: "hidden", height: "100%" }}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2 }}>qwen-pool-1 · live network</span>
                <Badge kind="primary" label="streaming"/>
              </div>
              <NetworkGraph width={760} height={500} nodeCount={7}/>
            </Card>

            <div style={{
              position: "absolute", left: -18, top: 140,
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              fontFamily: FONT_BODY, fontSize: 12, color: T.text2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.primary, animation: "cp-pulse 1.6s ease-in-out infinite" }}/>
                node-c earning
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: T.text1, fontWeight: 500, marginTop: 4, whiteSpace: "nowrap" }}>
                +0.0042 USDCx/s
              </div>
            </div>

            <div style={{
              position: "absolute", right: -18, bottom: 120,
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              fontFamily: FONT_BODY, fontSize: 12, color: T.text2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.purple }}/>
                coalition activated
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text1, marginTop: 4 }}>
                0xabc…f019 ↗
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "80px 64px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>How it works</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 44, color: T.text1, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
            Three steps. Zero trust required.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { n: "01", t: "Choose a model", d: "Pick from open-source LLMs hosted across our operator pools. Each pool exposes its node count, price, and latency." },
            { n: "02", t: "Set your budget", d: "You commit USDCx upfront. A Superfluid stream opens to the operators the moment inference begins." },
            { n: "03", t: "Watch it compute", d: "Tokens stream back in real time. If any node falters, KeeperHub slashes them on-chain and your refund happens automatically." },
          ].map((s) => (
            <Card key={s.n} padding={32}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.primary, fontWeight: 500 }}>{s.n}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: T.text1, marginTop: 14, letterSpacing: "-0.01em" }}>{s.t}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: T.text2, marginTop: 12, lineHeight: 1.55 }}>{s.d}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Models row */}
      <section style={{ padding: "40px 64px 80px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 32, color: T.text1, letterSpacing: "-0.02em", margin: 0 }}>
            Models available now
          </h2>
          <Link href="/infer" style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.primary, cursor: "pointer", textDecoration: "none" }}>
            Browse all →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { n: "Qwen3-4B", p: "4B", pools: 2, price: "0.02" },
            { n: "Llama-3.1-8B", p: "8B", pools: 1, price: "0.04" },
            { n: "Mistral-7B", p: "7B", pools: 1, price: "0.03" },
            { n: "Phi-3-mini", p: "3.8B", pools: 3, price: "0.018" },
          ].map((m) => (
            <Card key={m.n} padding={20}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: T.text1 }}>{m.n}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, marginTop: 2 }}>{m.p} parameters</div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 12 }}>
                <span style={{ color: T.text3 }}>{m.pools} pool{m.pools > 1 ? "s" : ""}</span>
                <span style={{ color: T.text1 }}>{m.price} USDCx</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "40px 64px 120px", maxWidth: 1440, margin: "0 auto" }}>
        <Card padding={64} style={{ background: T.text1, border: "none", textAlign: "center" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 48, color: T.bg, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            Verifiable compute. Streaming payments.
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: T.text3, margin: "0 0 32px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Every job is settled on 0G Galileo with a public audit trail. Every operator earns by the second.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/infer" style={{ textDecoration: "none" }}>
              <Button kind="primary">Run your first inference →</Button>
            </Link>
          </div>
        </Card>
      </section>

      <Footer/>
    </div>
  );
}
