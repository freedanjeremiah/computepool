"use client";

import * as React from "react";
import Link from "next/link";
import { useT, FONT_BODY, FONT_MONO } from "./theme";
import { Logo } from "./logo";
import { Badge, Button } from "./primitives";
import { useWallet } from "@/lib/use-wallet";
import { useBreakpoint } from "@/lib/use-breakpoint";

export function TopNav({ active }: { active: "landing" | "dashboard" | "infer" | "pitch" | "wallet" }) {
  const T = useT();
  const isMobile = useBreakpoint();
  const { state: w, connect, busy } = useWallet();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const items = [
    { id: "landing",   label: "Home",          path: "/" },
    { id: "dashboard", label: "Dashboard",     path: "/dashboard" },
    { id: "infer",     label: "Run inference", path: "/infer" },
    { id: "wallet",    label: "Wallet",        path: "/wallet" },
    { id: "pitch",     label: "Pitch",         path: "/pitch" },
  ] as const;

  const short = w.address ? `${w.address.slice(0, 6)}…${w.address.slice(-4)}` : null;
  const chainLabel = w.address
    ? (w.rightChain ? "0G Galileo · live" : `wrong chain (${w.chainId ?? "?"})`)
    : "0G Galileo · live";
  const chainKind: "primary" | "amber" = w.address && !w.rightChain ? "amber" : "primary";

  React.useEffect(() => { setMenuOpen(false); }, [active]);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: `${T.bg}E6`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: isMobile ? "14px 16px" : "18px 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ cursor: "pointer", textDecoration: "none" }}>
          <Logo size={26}/>
        </Link>

        {/* Desktop: nav links */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {items.map((i) => (
              <Link key={i.id} href={i.path} style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
                color: active === i.id ? T.text1 : T.text2,
                background: active === i.id ? T.surfaceWarm : "transparent",
                whiteSpace: "nowrap", textDecoration: "none",
              }}>{i.label}</Link>
            ))}
          </div>
        )}

        {/* Desktop: wallet */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Badge kind={chainKind} label={chainLabel}/>
            {short ? (
              <Link href="/connect" style={{ textDecoration: "none" }}>
                <Button kind="secondary" style={{ whiteSpace: "nowrap", fontFamily: FONT_MONO }}>
                  {short}
                </Button>
              </Link>
            ) : w.available ? (
              <Button kind="secondary" disabled={busy} onClick={connect} style={{ whiteSpace: "nowrap" }}>
                {busy ? "Connecting…" : "Connect wallet"}
              </Button>
            ) : (
              <Link href="/connect" style={{ textDecoration: "none" }}>
                <Button kind="secondary" style={{ whiteSpace: "nowrap" }}>Sign in</Button>
              </Link>
            )}
          </div>
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 6px", color: T.text1, fontSize: 22, lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        )}
      </nav>

      {/* Mobile: dropdown menu */}
      {isMobile && menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 48, background: "rgba(0,0,0,0.35)" }}
          />
          <div style={{
            position: "fixed", top: 57, left: 0, right: 0, zIndex: 49,
            background: T.bg, borderBottom: `1px solid ${T.border}`,
            paddingBottom: 8,
          }}>
            {items.map((i) => (
              <Link
                key={i.id}
                href={i.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block", padding: "13px 20px",
                  fontFamily: FONT_BODY, fontSize: 16, fontWeight: 500,
                  color: active === i.id ? T.primary : T.text1,
                  background: active === i.id ? T.primaryLight : "transparent",
                  textDecoration: "none",
                }}
              >{i.label}</Link>
            ))}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, marginTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>
              <Badge kind={chainKind} label={chainLabel}/>
              {short ? (
                <Link href="/connect" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                  <Button kind="secondary" full style={{ fontFamily: FONT_MONO }}>{short}</Button>
                </Link>
              ) : w.available ? (
                <Button kind="secondary" full disabled={busy} onClick={() => { connect(); setMenuOpen(false); }}>
                  {busy ? "Connecting…" : "Connect wallet"}
                </Button>
              ) : (
                <Link href="/connect" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                  <Button kind="secondary" full>Sign in</Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function Footer() {
  const T = useT();
  const isMobile = useBreakpoint();
  return (
    <footer style={{
      borderTop: `1px solid ${T.border}`,
      padding: isMobile ? "24px 20px" : "40px 64px",
      maxWidth: 1440, margin: "0 auto",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: isMobile ? 10 : 0,
    }}>
      <Logo size={22}/>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text3 }}>
        © 2026 ComputePool · 0G Galileo · v0.4.2
      </div>
    </footer>
  );
}
