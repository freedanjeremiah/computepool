"use client";

import * as React from "react";
import Link from "next/link";
import { useT, FONT_BODY, FONT_MONO } from "./theme";
import { Logo } from "./logo";
import { Badge, Button } from "./primitives";
import { useWallet } from "@/lib/use-wallet";
import { useBreakpoint } from "@/lib/use-breakpoint";

type Item = { id: string; label: string; icon: string; path: string };

const ITEMS: Item[] = [
  { id: "/",         label: "Overview",  icon: "◇", path: "/dashboard" },
  { id: "/pools",    label: "Pools",     icon: "⬡", path: "/dashboard/pools" },
  { id: "/nodes",    label: "Nodes",     icon: "●", path: "/dashboard/nodes" },
  { id: "/jobs",     label: "Jobs",      icon: "▤", path: "/dashboard/jobs" },
  { id: "/payments", label: "Payments",  icon: "⤳", path: "/dashboard/payments" },
];

export function Sidebar({ active, open, onClose }: {
  active: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const T = useT();
  const isMobile = useBreakpoint();

  const asideStyle: React.CSSProperties = isMobile ? {
    position: "fixed", top: 0, left: 0,
    width: 240, height: "100vh",
    background: T.surface, borderRight: `1px solid ${T.border}`,
    display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0,
    zIndex: 200,
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.25s ease",
    overflowY: "auto",
  } : {
    width: 240, background: T.surface, borderRight: `1px solid ${T.border}`,
    display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0,
    position: "sticky", top: 0, height: "100vh",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 199,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}
      <aside style={asideStyle}>
        <div style={{ padding: "0 20px 24px" }}>
          <Link href="/" style={{ cursor: "pointer", textDecoration: "none" }}><Logo size={22}/></Link>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {ITEMS.map((it) => {
            const on = active === it.id;
            return (
              <Link key={it.id} href={it.path} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 12,
                height: 40, padding: "0 12px",
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
                color: on ? T.primary : T.text2,
                background: on ? T.primaryLight : "transparent",
                borderLeft: on ? `3px solid ${T.primary}` : "3px solid transparent",
                cursor: "pointer", borderRadius: 0, textDecoration: "none",
              }}>
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ flex: 1 }}/>
        <SidebarWalletFooter/>
      </aside>
    </>
  );
}

function SidebarWalletFooter() {
  const T = useT();
  const { state: w, connect, disconnect, busy } = useWallet();
  const short = w.address ? `${w.address.slice(0, 6)}…${w.address.slice(-4)}` : null;
  const chainKind: "primary" | "amber" = w.address && !w.rightChain ? "amber" : "primary";
  const chainLabel = w.address && !w.rightChain ? `chain ${w.chainId ?? "?"}` : "0G Galileo · live";
  return (
    <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
      <Badge kind={chainKind} label={chainLabel} style={{ marginBottom: 10 }}/>
      {short ? (
        <>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.text2 }}>{short}</div>
          <div onClick={disconnect}
            style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: T.text3, cursor: "pointer" }}>
            Disconnect
          </div>
        </>
      ) : w.available ? (
        <Button kind="secondary" full disabled={busy} onClick={connect}
          style={{ padding: "8px 12px", fontSize: 13 }}>
          {busy ? "Connecting…" : "Connect wallet"}
        </Button>
      ) : (
        <Link href="/connect" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.text2 }}>No wallet detected</div>
        </Link>
      )}
    </div>
  );
}
