"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card } from "@/components/cp/primitives";
import { TopNav, Footer } from "@/components/cp/top-nav";
import { auth, ApiError } from "@/lib/api";
import {
  saveAuth, loadAuth, clearAuth,
  saveDemoPayerKey, loadDemoPayerKey, clearDemoPayerKey,
  saveChainId, loadChainId,
} from "@/lib/auth-store";
import { privateKeyToAccount } from "viem/accounts";

type Tab = "signin" | "register";

export default function ConnectPage() {
  const T = useT();
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("signin");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [me, setMe] = React.useState<{ username: string; apiKey: string } | null>(null);

  // demo payer / wallet
  const [demoKey, setDemoKey] = React.useState("");
  const [demoSaved, setDemoSaved] = React.useState<{ address: string } | null>(null);
  const [chainId, setChainIdState] = React.useState(16602);
  const [demoErr, setDemoErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    const a = loadAuth();
    if (a) setMe(a);
    const k = loadDemoPayerKey();
    if (k) {
      try {
        const acct = privateKeyToAccount((k.startsWith("0x") ? k : `0x${k}`) as `0x${string}`);
        setDemoSaved({ address: acct.address });
      } catch {
        setDemoSaved(null);
      }
    }
    setChainIdState(loadChainId());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (tab === "register" && password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const fn = tab === "signin" ? auth.login : auth.register;
      const r = await fn(username.trim(), password);
      saveAuth(r.username, r.api_key);
      setMe({ username: r.username, apiKey: r.api_key });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message;
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    clearAuth();
    setMe(null);
    setUsername("");
    setPassword("");
    setConfirm("");
  };

  const saveDemo = () => {
    setDemoErr(null);
    const k = demoKey.trim();
    if (!/^0x?[0-9a-fA-F]{64}$/.test(k.startsWith("0x") ? k : `0x${k}`)) {
      setDemoErr("Expected a 0x-prefixed 64-hex private key.");
      return;
    }
    try {
      const acct = privateKeyToAccount((k.startsWith("0x") ? k : `0x${k}`) as `0x${string}`);
      saveDemoPayerKey(k.startsWith("0x") ? k : `0x${k}`);
      setDemoSaved({ address: acct.address });
      setDemoKey("");
    } catch (e) {
      setDemoErr((e as Error).message);
    }
  };

  const updateChain = (v: string) => {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    setChainIdState(n);
    saveChainId(n);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <TopNav active="landing"/>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "60px 32px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <Badge kind="primary" label="ComputePool · 0G Galileo testnet"/>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 40,
            color: T.text1, letterSpacing: "-0.02em", margin: "16px 0 8px",
          }}>
            Connect
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: T.text2, margin: 0, lineHeight: 1.5 }}>
            Step 1 — sign in for orchestrator API access. Step 2 — paste a demo payer key so the
            browser can sign x402 transferWithAuthorization for live inference.
          </p>
        </div>

        {/* — Step 1: orchestrator account — */}
        {me ? (
          <Card padding={24} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: T.text1 }}>
                Signed in as {me.username}
              </span>
              <Badge kind="primary" label="active"/>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2 }}>API key</div>
            <div style={{
              marginTop: 6, padding: "10px 14px", borderRadius: 8, background: T.surfaceWarm,
              fontFamily: FONT_MONO, fontSize: 13, color: T.text1, wordBreak: "break-all",
            }}>{me.apiKey}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Button kind="secondary" onClick={signOut}>Sign out</Button>
              <Button kind="ghost"     onClick={() => router.push("/dashboard")}>Open dashboard →</Button>
            </div>
          </Card>
        ) : (
          <Card padding={24} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {(["signin", "register"] as const).map((id) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{
                    background: tab === id ? T.surfaceWarm : "transparent",
                    color: tab === id ? T.text1 : T.text2,
                    border: `1px solid ${tab === id ? T.borderStrong : T.border}`,
                    borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                    fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
                  }}>{id === "signin" ? "Sign in" : "Register"}</button>
              ))}
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Username" value={username} onChange={setUsername} placeholder="alice"/>
              <Field label="Password" value={password} onChange={setPassword} placeholder="********" type="password"/>
              {tab === "register" && (
                <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="********" type="password"/>
              )}
              {err && <ErrLine v={err}/>}
              <Button kind="primary" type="submit" full disabled={busy} style={{ marginTop: 4 }}>
                {busy ? "Working…" : tab === "signin" ? "Sign in →" : "Create account →"}
              </Button>
            </form>
          </Card>
        )}

        {/* — Step 2: demo payer wallet — */}
        <Card padding={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: T.text1 }}>
              Demo payer wallet
            </span>
            {demoSaved && <Badge kind="primary" label="loaded"/>}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, lineHeight: 1.5, marginBottom: 12 }}>
            The x402 EIP-3009 signer needs a private key to sign <code>transferWithAuthorization</code>.
            For the demo we keep this in <code>localStorage</code>. Use a throwaway testnet key — never paste a key
            with mainnet funds.
          </div>

          {demoSaved ? (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2 }}>Payer address</div>
              <div style={{
                marginTop: 6, padding: "10px 14px", borderRadius: 8, background: T.surfaceWarm,
                fontFamily: FONT_MONO, fontSize: 13, color: T.text1, wordBreak: "break-all",
              }}>{demoSaved.address}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Button kind="ghost" onClick={() => { clearDemoPayerKey(); setDemoSaved(null); }}>
                  Forget key
                </Button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Private key (0x…64 hex)" value={demoKey} onChange={setDemoKey}
                placeholder="0x..." type="password"/>
              {demoErr && <ErrLine v={demoErr}/>}
              <Button kind="primary" full disabled={!demoKey} onClick={saveDemo}>
                Save demo payer key
              </Button>
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2 }}>Chain ID</span>
              <input type="number" value={chainId} onChange={(e) => updateChain(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.surface,
                  color: T.text1, fontFamily: FONT_MONO, fontSize: 13,
                  width: 140,
                }}/>
            </div>
            <div style={{ marginTop: 6, fontFamily: FONT_BODY, fontSize: 12, color: T.text3 }}>
              0G Galileo Testnet is 16602.
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="secondary" onClick={() => router.push("/dashboard")}>Open dashboard</Button>
          <Button kind="primary"   onClick={() => router.push("/infer")}>Run inference →</Button>
        </div>
      </section>
      <Footer/>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const T = useT();
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px", borderRadius: 8,
          border: `1px solid ${T.border}`, background: T.surface,
          color: T.text1, fontFamily: FONT_BODY, fontSize: 14, outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
        onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
      />
    </label>
  );
}

function ErrLine({ v }: { v: string }) {
  const T = useT();
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, background: T.redLight,
      fontFamily: FONT_BODY, fontSize: 13, color: T.red,
    }}>{v}</div>
  );
}
