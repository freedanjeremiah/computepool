"use client";

import * as React from "react";
import Link from "next/link";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card } from "@/components/cp/primitives";
import { TopNav, Footer } from "@/components/cp/top-nav";
import { NetworkGraph } from "@/components/cp/network-graph";
import { useBreakpoint } from "@/lib/use-breakpoint";

export default function LandingPage() {
  const T = useT();
  const isMobile = useBreakpoint();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <TopNav active="landing"/>

      {/* Hero */}
      <section style={{ padding: isMobile ? "40px 20px 24px" : "80px 64px 40px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 760px",
          gap: isMobile ? 32 : 64,
          alignItems: "center",
        }}>
          <div>
            <Badge kind="primary" label="Live on 0G Galileo · 4 pools active" style={{ marginBottom: 24 }}/>
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontWeight: 600,
              fontSize: isMobile ? 44 : 72,
              lineHeight: 1.05,
              color: T.text1, letterSpacing: "-0.03em", margin: "0 0 24px",
            }}>
              A live atlas<br/>of decentralized<br/>compute.
            </h1>
            <p style={{
              fontFamily: FONT_BODY,
              fontSize: isMobile ? 16 : 20,
              color: T.text2, lineHeight: 1.5, margin: "0 0 36px", maxWidth: 540,
            }}>
              Run inference on a network of independent operators. Pay by the second with on-chain streaming payments. Watch every token get computed, in real time.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/infer" style={{ textDecoration: "none" }}>
                <Button kind="primary">Run inference →</Button>
              </Link>
              <Link href="/dashboard" style={{ textDecoration: "none" }}>
                <Button kind="secondary">Open dashboard</Button>
              </Link>
            </div>

            <div style={{ display: "flex", gap: isMobile ? 28 : 48, marginTop: isMobile ? 36 : 64, flexWrap: "wrap" }}>
              {([
                ["Active nodes", "24"],
                ["Avg latency", "11.2 tok/s"],
                ["Settled today", "8,402 USDCx"],
              ] as const).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: isMobile ? 22 : 28, color: T.text1, marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NetworkGraph: hidden on mobile to avoid overflow */}
          {!isMobile && (
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
          )}
        </div>
      </section>

      {/* Idle GPU callout */}
      <div style={{ padding: isMobile ? "0 20px" : "0 64px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
          padding: isMobile ? "22px 0" : "28px 0",
          textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: T.primary, flexShrink: 0, animation: "cp-pulse 1.6s ease-in-out infinite" }}/>
          <p style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isMobile ? 17 : 22,
            color: T.text2,
            margin: 0,
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}>
            Your GPU earns nothing sitting idle.{" "}
            <span style={{ color: T.text1, fontWeight: 600 }}>List it once, get paid by the second.</span>
          </p>
        </div>
      </div>

      {/* How it works */}
      <section style={{ padding: isMobile ? "48px 20px" : "80px 64px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>How it works</div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600,
            fontSize: isMobile ? 30 : 44,
            color: T.text1, letterSpacing: "-0.02em", margin: "8px 0 0",
          }}>
            Three steps. Zero trust required.
          </h2>
        </div>
        <div
          className={isMobile ? undefined : "cp-howit-works-row"}
          style={isMobile ? { display: "grid", gridTemplateColumns: "1fr", gap: 16 } : undefined}
        >
          {([
            { n: "01", t: "Choose a model", d: "Pick from open-source LLMs hosted across our operator pools. Each pool exposes its node count, price, and latency.", img: { src: "/step-1-how-it-works.png", alt: "Step 1: choose a model" } },
            { n: "02", t: "Set your budget", d: "You commit USDCx upfront. A Superfluid stream opens to the operators the moment inference begins.", img: { src: "/step-2-how-it-works.png", alt: "Step 2: set your budget" } },
            { n: "03", t: "Watch it compute", d: "Tokens stream back in real time. If any node falters, KeeperHub slashes them on-chain and your refund happens automatically.", img: { src: "/step-3-how-it-works.png", alt: "Step 3: watch it compute" } },
          ] as const).map((s) => (
            <div
              key={s.n}
              className={isMobile ? undefined : "cp-howit-works-expand"}
              tabIndex={isMobile ? undefined : 0}
            >
            <Card padding={isMobile ? 24 : 32} style={isMobile ? undefined : { height: "100%" }}>
              <div style={{
                marginBottom: 20,
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${T.border}`,
                background: T.surface,
                aspectRatio: "16 / 10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {"img" in s && s.img ? (
                  <img
                    src={s.img.src}
                    alt={s.img.alt}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: T.text3,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    Illustration placeholder
                  </div>
                )}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: T.primary, fontWeight: 500 }}>{s.n}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 20 : 24, fontWeight: 600, color: T.text1, marginTop: 14, letterSpacing: "-0.01em" }}>{s.t}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: T.text2, marginTop: 12, lineHeight: 1.55 }}>{s.d}</div>
            </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Models row */}
      <section style={{ padding: isMobile ? "24px 20px 48px" : "40px 64px 80px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: isMobile ? 24 : 32, color: T.text1, letterSpacing: "-0.02em", margin: 0 }}>
            Models available now
          </h2>
          <Link href="/infer" style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.primary, cursor: "pointer", textDecoration: "none" }}>
            Browse all →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 12 : 16 }}>
          {[
            { n: "Qwen3-4B", p: "4B", pools: 2, price: "0.02" },
            { n: "Llama-3.1-8B", p: "8B", pools: 1, price: "0.04" },
            { n: "Mistral-7B", p: "7B", pools: 1, price: "0.03" },
            { n: "Phi-3-mini", p: "3.8B", pools: 3, price: "0.018" },
          ].map((m) => (
            <Card key={m.n} padding={isMobile ? 14 : 20}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 18, fontWeight: 600, color: T.text1 }}>{m.n}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2, marginTop: 2 }}>{m.p} parameters</div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 11, flexWrap: "wrap", gap: 4 }}>
                <span style={{ color: T.text3 }}>{m.pools} pool{m.pools > 1 ? "s" : ""}</span>
                <span style={{ color: T.text1 }}>{m.price} USDCx</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: isMobile ? "40px 20px 48px" : "80px 64px 80px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ marginBottom: isMobile ? 32 : 52 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Common questions</div>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600,
            fontSize: isMobile ? 30 : 44,
            color: T.text1, letterSpacing: "-0.02em", margin: "8px 0 0",
          }}>
            Everything you'd want to know.
          </h2>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {([
            { group: "For node operators" },
            { q: "My gaming PC sits idle most of the day. Can it actually earn?", a: "Yes — that's exactly the use case. ComputePool splits a model's layers across two machines, so a single RTX 3060 or 4070 running just half the network is a valid earning node. A 70B model would normally need 140 GB of VRAM; two consumer cards sharing the load can cover it together. If your card can handle half a model, you're in." },
            { q: "My GPU is only 8 GB — is that enough to start earning?", a: "For the models currently live, yes. The 1B–4B parameter range needs far less VRAM per shard, and 8 GB comfortably covers one side of the split. Larger model support with more shard sizes is on the roadmap, which opens up more earning tiers over time." },
            { q: "Do I have to commit to being online all the time?", a: "Not at all. Your node earns only when it's actively serving a job — there is no uptime commitment. Go offline whenever you want. If you disconnect mid-job, KeeperHub detects it, stops the job, and the caller is refunded. No penalty for going offline cleanly." },
            { q: "When does money actually start flowing into my wallet?", a: "The moment inference begins. Superfluid opens a real-time payment stream as soon as a job starts, so USDCx flows in continuously while your node is computing — by the second, not in a lump sum at the end." },
            { group: "For users running inference" },
            { q: "Why is it so much cheaper than cloud APIs?", a: "Operators set their own price per token with zero platform markup. Since anyone with spare compute can become an operator, prices reflect real marginal cost — electricity and hardware amortisation — not cloud profit margins. On testnet, demo pools run at a fraction of OpenAI pricing." },
            { q: "What if a node drops out while generating my response?", a: "It is handled automatically. KeeperHub monitors every job; if a node misses its heartbeat mid-generation it gets slashed on-chain and your unused budget is refunded immediately. No dispute, no waiting — enforced by the workflow." },
            { q: "What models can I run right now?", a: "Llama 3.2 (1B and 3B), Qwen 2.5-3B-Instruct, and Qwen3-4B-Instruct are live today. Operators can add any HuggingFace model — the layer split is calculated automatically from the model's architecture." },
            { group: "General" },
            { q: "Is the code open source?", a: "Fully. The orchestrator, worker, smart contracts, and KeeperHub workflows are all public. You can self-host an entire pool with a single make build && make up and start earning in minutes." },
          ] as const).map((item, i) => {
            if ("group" in item) {
              return (
                <div key={i} style={{
                  marginTop: i === 0 ? 0 : 36,
                  marginBottom: 12,
                  fontFamily: FONT_MONO, fontSize: 11, color: T.primary,
                  textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
                }}>
                  {item.group}
                </div>
              );
            }
            const idx = i;
            const isOpen = openFaq === idx;
            return (
              <div key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    padding: "18px 0", textAlign: "left", gap: 16,
                  }}
                >
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 17, fontWeight: 600, color: T.text1, lineHeight: 1.3 }}>
                    {item.q}
                  </span>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 11,
                    border: `1.5px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_MONO, fontSize: 16, color: isOpen ? T.primary : T.text3,
                    borderColor: isOpen ? T.primary : T.border,
                    transition: "color 0.15s, border-color 0.15s",
                  }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{
                    paddingBottom: 20,
                    fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 15,
                    color: T.text2, lineHeight: 1.65, maxWidth: 680,
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? "24px 20px 60px" : "40px 64px 120px", maxWidth: 1440, margin: "0 auto" }}>
        <Card padding={isMobile ? 32 : 64} style={{ background: T.text1, border: "none", textAlign: "center" }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600,
            fontSize: isMobile ? 28 : 48,
            color: T.bg, letterSpacing: "-0.02em", margin: "0 0 16px",
          }}>
            Verifiable compute. Streaming payments.
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 18, color: T.text3, margin: "0 0 32px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
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
