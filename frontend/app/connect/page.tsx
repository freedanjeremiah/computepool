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
import { useWallet } from "@/lib/use-wallet";

type Tab = "signin" | "register";

export default function ConnectPage() {
  const T = useT();
  const router = useRouter();
  const { state: wallet, connect: connectWallet, disconnect: disconnectWallet, switchChain, busy: walletBusy, error: walletErr } = useWallet();
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
            Step 1 — sign in for orchestrator API access. Step 2 — connect MetaMask
            (or any EIP-1193 wallet) to authorize x402 payments. A throwaway demo key is
            available as a fallback.
          </p>
        </div>

        {/* — Wallet connect (primary) — */}
        <Card padding={24} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: T.text1 }}>
              Wallet
            </span>
            {wallet.address && wallet.rightChain && <Badge kind="primary" label="connected"/>}
            {wallet.address && !wallet.rightChain && <Badge kind="amber" label={`wrong chain (${wallet.chainId ?? "?"})`}/>}
            {!wallet.address && wallet.available && <Badge kind="amber" label="not connected"/>}
            {!wallet.available && <Badge kind="offline" label="no injected wallet"/>}
          </div>

          {!wallet.available ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
              No injected EIP-1193 provider detected. Install
              {" "}<a href="https://metamask.io/download/" target="_blank" rel="noreferrer" style={{ color: T.primary }}>MetaMask</a>{" "}
              or another browser wallet, then refresh this page. You can still use the demo payer
              key below for local testing.
            </div>
          ) : !wallet.address ? (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, lineHeight: 1.5, marginBottom: 14 }}>
                Connect MetaMask (or any EOA wallet) and we&apos;ll use it to sign EIP-3009
                <code style={{ margin: "0 4px" }}>transferWithAuthorization</code> for live inference. No
                approvals on chain — just an EIP-712 signature in your wallet.
              </div>
              <Button kind="primary" full disabled={walletBusy} onClick={connectWallet}>
                {walletBusy ? "Connecting…" : "Connect wallet →"}
              </Button>
              {walletErr && <ErrLine v={walletErr}/>}
            </>
          ) : (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2 }}>Address</div>
              <div style={{
                marginTop: 6, padding: "10px 14px", borderRadius: 8, background: T.surfaceWarm,
                fontFamily: FONT_MONO, fontSize: 13, color: T.text1, wordBreak: "break-all",
              }}>{wallet.address}</div>
              <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 12, color: T.text2 }}>
                Chain {wallet.chainId ?? "?"} {wallet.rightChain ? "✓" : `(expected ${wallet.expectedChainId})`}
              </div>
              {!wallet.rightChain && (
                <Button kind="secondary" full disabled={walletBusy} onClick={switchChain} style={{ marginTop: 12 }}>
                  {walletBusy ? "Switching…" : `Switch to chain ${wallet.expectedChainId}`}
                </Button>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button kind="ghost" onClick={disconnectWallet}>Disconnect</Button>
                <Button kind="ghost" onClick={() => router.push("/infer")}>Run inference →</Button>
              </div>
              {walletErr && <ErrLine v={walletErr}/>}
            </>
          )}
        </Card>

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

        {/* — Demo payer wallet (fallback) — */}
        <Card padding={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: T.text1 }}>
              Demo payer key (fallback)
            </span>
            {demoSaved && <Badge kind="primary" label="loaded"/>}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2, lineHeight: 1.5, marginBottom: 12 }}>
            Only needed when no injected wallet is available (CI, headless demos, etc). The browser
            wallet above is preferred. Stored in <code>localStorage</code>; use a throwaway testnet
            key only — never one with mainnet funds.
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
