"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card, RowKV } from "@/components/cp/primitives";
import { useInferState } from "@/lib/use-infer-state";
import { fetchPaymentRequirements } from "@/lib/infer-stream";
import { signX402 } from "@/lib/sign-payment";
import { loadAuth, loadDemoPayerKey, loadChainId } from "@/lib/auth-store";

export default function InferStep3() {
  const T = useT();
  const router = useRouter();
  const { state, setState } = useInferState();
  const [ph, setPh] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => setPh((p) => p + 1), 100);
    return () => clearInterval(id);
  }, []);

  const live = state.mode === "live";
  const auth = typeof window === "undefined" ? null : loadAuth();
  const demoKey = typeof window === "undefined" ? null : loadDemoPayerKey();
  const liveReady = live && !!auth && !!demoKey;
  const liveBlocker = !auth ? "Sign in at /connect first." :
                      !demoKey ? "Add a demo payer private key on /connect." : null;

  const confirm = async () => {
    setErr(null);
    if (!live) {
      router.push("/infer/active");
      return;
    }
    if (!auth || !demoKey) {
      setErr(liveBlocker ?? "Live prerequisites missing.");
      return;
    }
    setBusy(true);
    try {
      const requirements = await fetchPaymentRequirements({
        poolName: state.poolName,
        prompt: state.prompt,
        maxTokens: state.maxTokens,
        apiKey: auth.apiKey,
      });
      const { header, payer } = await signX402({
        privateKey: demoKey,
        requirements,
        chainId: loadChainId(),
      });
      setState({ ...state, xPayment: header, payer, requirements });
      router.push("/infer/active");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <Card padding={48}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 28, color: T.text1, letterSpacing: "-0.02em", margin: "0 0 28px" }}>
            Review your request
          </h2>
          <Badge kind={live ? "primary" : "amber"} label={live ? "live" : "demo"}/>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RowKV k="Model"         v={state.modelName}/>
          <RowKV k="Pool"          v={state.poolName}/>
          <RowKV k="Max tokens"    v={String(state.maxTokens)}/>
          <RowKV k="Est. cost"     v={`${(state.maxTokens * state.pricePerTokenUsdc).toFixed(4)} USDC`}/>
          <RowKV k="Est. duration" v={`~${Math.round(state.maxTokens * (live ? 8 : 0.05))} seconds`}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>Coalition</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: live ? T.primary : T.amber, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: live ? T.primary : T.amber, opacity: 0.5 + 0.5 * Math.sin(ph * 0.3) }}/>
              {live ? "Already on-chain" : "Forming on-chain…"}
            </span>
          </div>
          {state.payer && (
            <RowKV k="Payer" v={`${state.payer.slice(0, 8)}…${state.payer.slice(-6)}`}/>
          )}
        </div>

        <div style={{ marginTop: 28, padding: 20, borderRadius: 10, background: T.surfaceWarm, fontFamily: FONT_BODY, fontSize: 15, color: T.text2, lineHeight: 1.6 }}>
          “{state.prompt}”
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, marginBottom: 10, fontWeight: 500 }}>
            What happens when you confirm
          </div>
          {(live ? [
            "Orchestrator returns 402 with x402 PaymentRequirements",
            "Browser signs EIP-3009 transferWithAuthorization (USDC)",
            "POST /pools/{name}/infer/stream with the signed X-PAYMENT",
            "Tokens stream over SSE; settlement happens on done",
          ] : [
            "Skip on-chain — show the canned animation",
            "Token stream comes from a static script",
            "No wallet, no payment, no settlement",
            "Useful to demo the flow without real infra",
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", fontFamily: FONT_BODY, fontSize: 14, color: T.text2 }}>
              <span style={{ color: T.primary, fontWeight: 500 }}>{i + 1}.</span> {s}
            </div>
          ))}
        </div>

        {live && liveBlocker && (
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 8,
            background: T.amberLight, fontFamily: FONT_BODY, fontSize: 13, color: T.amber,
          }}>
            {liveBlocker}
          </div>
        )}
        {err && (
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 8,
            background: T.redLight, fontFamily: FONT_BODY, fontSize: 13, color: T.red,
          }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <Button kind="secondary" onClick={() => router.push("/infer/setup")} style={{ flex: 1 }}>
            Back
          </Button>
          <Button kind="primary" onClick={confirm} disabled={busy || (live && !liveReady)} style={{ flex: 2 }}>
            {busy ? "Signing…" : (live ? "Confirm + Pay →" : "Run demo →")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
