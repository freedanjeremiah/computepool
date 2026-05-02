"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card, FlowLine, Ticker } from "@/components/cp/primitives";
import { NodeRow } from "@/components/cp/dashboard-bits";
import { useInferState } from "@/lib/use-infer-state";
import { streamInfer } from "@/lib/infer-stream";
import { loadAuth } from "@/lib/auth-store";
import { saveJob } from "@/lib/job-history";

const DEMO_TEXT = `Attention is how a transformer decides what to focus on.

For each token in the input, the model computes three vectors: a query, a key, and a value. The query asks "what am I looking for?" — the keys describe "what each other token offers" — the values are "what gets passed forward."

Token i's output is a weighted sum of every other token's value, where the weights come from how well token i's query matches each token's key.

This means every token can directly attend to every other token, regardless of distance. That's the breakthrough.`;

export default function InferStep4() {
  const T = useT();
  const router = useRouter();
  const { state, setState } = useInferState();

  const live = state.mode === "live" && !!state.xPayment;
  const [output, setOutput] = React.useState("");
  const [tokens, setTokens] = React.useState(0);
  const [breached, setBreached] = React.useState(false);
  const [tickN, setTickN] = React.useState(0);
  const [phase, setPhase] = React.useState<"connecting" | "streaming" | "settling" | "done" | "error">("connecting");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    const id = setInterval(() => setTickN((n) => n + 1), 16);
    return () => clearInterval(id);
  }, []);

  // ── Demo branch ─────────────────────────────────────────────
  React.useEffect(() => {
    if (live) return;
    let chars = 0;
    setPhase("streaming");
    const id = setInterval(() => {
      chars = Math.min(chars + 8, DEMO_TEXT.length);
      setOutput(DEMO_TEXT.slice(0, chars));
      if (chars >= DEMO_TEXT.length) clearInterval(id);
    }, 60);
    const breachTimer = setTimeout(() => setBreached(true), 7000);
    const finishTimer = setTimeout(() => {
      setState((s) => ({ ...s, output: DEMO_TEXT, breached: true, durationMs: 9000, tokens: 60, costUsdc: 0 }));
      setPhase("done");
      router.push("/infer/result");
    }, 11000);
    return () => {
      clearInterval(id);
      clearTimeout(breachTimer);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // ── Live branch ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!live || startedRef.current) return;
    startedRef.current = true;
    const auth = loadAuth();
    if (!auth || !state.xPayment) {
      setErrorMsg("missing auth or signed payment — go back to /infer/review");
      setPhase("error");
      return;
    }
    const ac = new AbortController();
    const startedAt = Date.now();
    setPhase("streaming");

    (async () => {
      try {
        let acc = "";
        let tk = 0;
        let cost = 0;
        let settleTx: string | undefined;
        let requestId = "";
        for await (const ev of streamInfer({
          poolName: state.poolName,
          prompt: state.prompt,
          maxTokens: state.maxTokens,
          temperature: 0,
          apiKey: auth.apiKey,
          xPayment: state.xPayment!,
          signal: ac.signal,
        })) {
          if (ev.event === "token") {
            acc += ev.delta;
            tk += 1;
            if (ev.request_id) requestId = ev.request_id;
            setOutput(acc);
            setTokens(tk);
          } else if (ev.event === "done") {
            acc = ev.text || acc;
            tk = ev.tokens ?? tk;
            cost = ev.cost_usdc ?? 0;
            requestId = ev.request_id || requestId;
            setOutput(acc);
            setTokens(tk);
            setPhase("settling");
          } else if (ev.event === "settle") {
            settleTx = ev.transaction;
            setPhase("done");
          } else if (ev.event === "error") {
            setErrorMsg(ev.error);
            setPhase("error");
          }
        }
        const durMs = Date.now() - startedAt;
        saveJob({
          request_id: requestId || crypto.randomUUID(),
          pool: state.poolName,
          model: state.modelName,
          prompt: state.prompt,
          status: "complete",
          tokens: tk,
          duration_s: durMs / 1000,
          cost_usdc: cost,
          output: acc,
          payer: state.payer ?? undefined,
          settle_tx: settleTx,
          ts: Date.now(),
        });
        setState((s) => ({
          ...s, output: acc, tokens: tk, costUsdc: cost,
          durationMs: durMs, settleTx, breached: false,
        }));
        // tiny delay so user sees "settled" tick before navigating
        setTimeout(() => router.push("/infer/result"), 600);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setErrorMsg((e as Error).message);
        setPhase("error");
        saveJob({
          request_id: crypto.randomUUID(),
          pool: state.poolName,
          model: state.modelName,
          prompt: state.prompt,
          status: "error",
          error: (e as Error).message,
          ts: Date.now(),
        });
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const elapsed = (tickN * 16) / 1000;
  const aBal = Math.min(elapsed * 0.0042, 0.082);
  const bBal = breached ? 0.041 : Math.min(elapsed * 0.0042, 0.041);
  const liveCost = (tokens * state.pricePerTokenUsdc) || 0;
  const totalSpent = live ? liveCost : aBal + bBal;
  const totalBudget = state.budget || 0.5;
  const cap = state.maxTokens * state.pricePerTokenUsdc;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
      <Card padding={32} style={{ minHeight: 680 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Output</span>
          <Badge kind={phase === "error" ? "red" : phase === "done" ? "purple" : "primary"}
                 label={phaseLabel(phase, live)}/>
        </div>
        <div style={{ marginTop: 20, fontFamily: FONT_MONO, fontSize: 15, color: T.text1, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
          {output}
          {(phase === "streaming" || phase === "connecting") && (
            <span style={{
              display: "inline-block", width: 8, height: 18, background: T.primary,
              marginLeft: 2, verticalAlign: "-3px",
              opacity: Math.sin(tickN * 0.3) > 0 ? 1 : 0.2,
            }}/>
          )}
        </div>
        {errorMsg && (
          <div style={{ marginTop: 20, padding: "10px 14px", background: T.redLight, borderLeft: `3px solid ${T.red}`, borderRadius: 6, fontFamily: FONT_MONO, fontSize: 12, color: T.red }}>
            {errorMsg}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Network activity</span>
          </div>
          <svg width="100%" viewBox="0 0 380 220" style={{ display: "block" }}>
            <defs>
              <pattern id="cp-grid-mini" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={T.border} strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="380" height="220" fill="url(#cp-grid-mini)"/>
            <FlowLine d={`M 290 110 Q 190 65, 90 65`}/>
            <FlowLine d={`M 290 110 Q 190 155, 90 155`} frozen={breached}/>
            <circle cx={290} cy={110} r="18" fill={T.text1}/>
            <text x={290} y={144} textAnchor="middle" fontFamily={FONT_BODY} fontSize="11" fill={T.text2}>orchestrator</text>

            <circle cx={90} cy={65} r={16 + 2 * Math.sin(tickN * 0.1)} fill={T.primaryLight} opacity="0.6"/>
            <circle cx={90} cy={65} r="13" fill={T.primary}/>
            <text x={90} y={43} textAnchor="middle" fontFamily={FONT_BODY} fontSize="11" fontWeight="500" fill={T.text1}>node-a</text>
            <text x={90} y={95} textAnchor="middle" fontFamily={FONT_MONO} fontSize="9" fill={T.text3}>L0–17</text>

            {!breached && <circle cx={90} cy={155} r={16 + 2 * Math.sin(tickN * 0.1 + 1)} fill={T.primaryLight} opacity="0.6"/>}
            <circle cx={90} cy={155} r="13" fill={breached ? T.red : T.primary} style={{ transition: "fill 400ms ease" }}/>
            <text x={90} y={133} textAnchor="middle" fontFamily={FONT_BODY} fontSize="11" fontWeight="500"
              fill={breached ? T.red : T.text1} style={{ transition: "fill 400ms ease" }}>node-b</text>
            <text x={90} y={185} textAnchor="middle" fontFamily={FONT_MONO} fontSize="9" fill={T.text3}>L18–35</text>

            {[0, 1, 2].map((i) => {
              const ph = ((tickN * 0.012 + i * 0.33) % 1);
              const x = 290 + (90 - 290) * ph;
              const y = 110 + (65 - 110) * ph;
              return <circle key={"pa" + i} cx={x} cy={y} r="2.5" fill={T.primary} opacity={1 - ph * 0.5}/>;
            })}
            {!breached && [0, 1, 2].map((i) => {
              const ph = ((tickN * 0.012 + i * 0.33 + 0.5) % 1);
              const x = 290 + (90 - 290) * ph;
              const y = 110 + (155 - 110) * ph;
              return <circle key={"pb" + i} cx={x} cy={y} r="2.5" fill={T.primary} opacity={1 - ph * 0.5}/>;
            })}
          </svg>
        </Card>

        <Card padding={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Payment stream</span>
            <Badge kind="primary" label={live ? `${tokens} tok` : "live"}/>
          </div>
          <NodeRow id="node-a" hex="0xaaa…1234" rate={`+${live ? (liveCost / 2).toFixed(4) : aBal.toFixed(4)}`} frozen={false}/>
          <div style={{ height: 8 }}/>
          <NodeRow id="node-b" hex="0xbbb…5678" rate={breached ? "—" : `+${live ? (liveCost / 2).toFixed(4) : bBal.toFixed(4)}`} frozen={breached}/>
          {breached && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: T.redLight, borderLeft: `3px solid ${T.red}`, borderRadius: 6, fontFamily: FONT_BODY, fontSize: 13, color: T.red }}>
              node-b unresponsive — slashed by KeeperHub.
            </div>
          )}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, whiteSpace: "nowrap" }}>Total</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 500, color: T.text1, whiteSpace: "nowrap" }}>
                <Ticker value={totalSpent} decimals={4}/>{" "}
                <span style={{ color: T.text3, fontSize: 12 }}>/ {(live ? cap : totalBudget).toFixed(2)}</span>
              </span>
            </div>
            <div style={{ marginTop: 10, height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min((totalSpent / (live ? cap : totalBudget)) * 100, 100)}%`, background: T.primary, transition: "width 200ms linear" }}/>
            </div>
          </div>
          <Button kind="destructive" full style={{ marginTop: 16 }} onClick={() => router.push("/infer")}>
            Cancel inference
          </Button>
        </Card>
      </div>
    </div>
  );
}

function phaseLabel(phase: string, live: boolean): string {
  if (!live) return "demo streaming";
  return ({
    connecting: "connecting",
    streaming:  "streaming",
    settling:   "settling on-chain",
    done:       "settled",
    error:      "error",
  } as Record<string, string>)[phase] ?? phase;
}
