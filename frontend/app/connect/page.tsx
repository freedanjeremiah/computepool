"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useT, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "@/components/cp/theme";
import { Badge, Button, Card } from "@/components/cp/primitives";
import { TopNav, Footer } from "@/components/cp/top-nav";
import { auth, ApiError } from "@/lib/api";
import { saveAuth, loadAuth, clearAuth } from "@/lib/auth-store";

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

  React.useEffect(() => {
    const a = loadAuth();
    if (a) setMe(a);
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

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <TopNav active="landing"/>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 32px 60px" }}>
        <div style={{ marginBottom: 32 }}>
          <Badge kind="primary" label="ComputePool · 0G Galileo testnet"/>
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 44,
            color: T.text1, letterSpacing: "-0.02em", margin: "16px 0 8px",
          }}>
            Sign in or create an account
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: T.text2, margin: 0, lineHeight: 1.5 }}>
            Your account holds the API key the orchestrator uses to authenticate node + pool changes.
          </p>
        </div>

        {me ? (
          <Card padding={28}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: T.text1 }}>
                Signed in as {me.username}
              </span>
              <Badge kind="primary" label="active"/>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.text2 }}>API key</div>
            <div style={{
              marginTop: 6, padding: "10px 14px", borderRadius: 8, background: T.surfaceWarm,
              fontFamily: FONT_MONO, fontSize: 13, color: T.text1, wordBreak: "break-all",
            }}>
              {me.apiKey}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <Button kind="primary" onClick={() => router.push("/dashboard")}>Open dashboard →</Button>
              <Button kind="secondary" onClick={() => router.push("/infer")}>Run inference</Button>
              <Button kind="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </Card>
        ) : (
          <Card padding={28}>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {(["signin", "register"] as const).map((id) => (
                <button key={id}
                  onClick={() => setTab(id)}
                  style={{
                    background: tab === id ? T.surfaceWarm : "transparent",
                    color: tab === id ? T.text1 : T.text2,
                    border: `1px solid ${tab === id ? T.borderStrong : T.border}`,
                    borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                    fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
                  }}>
                  {id === "signin" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Username" value={username} onChange={setUsername} placeholder="alice" />
              <Field label="Password" value={password} onChange={setPassword} placeholder="********" type="password" />
              {tab === "register" && (
                <Field label="Confirm password" value={confirm} onChange={setConfirm} placeholder="********" type="password" />
              )}
              {err && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: T.redLight,
                  fontFamily: FONT_BODY, fontSize: 13, color: T.red,
                }}>{err}</div>
              )}
              <Button kind="primary" type="submit" full disabled={busy} style={{ marginTop: 6 }}>
                {busy ? "Working…" : tab === "signin" ? "Sign in →" : "Create account →"}
              </Button>
            </form>
          </Card>
        )}
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
