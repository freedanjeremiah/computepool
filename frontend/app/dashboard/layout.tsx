"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/cp/theme";
import { Logo } from "@/components/cp/logo";
import { Sidebar } from "@/components/cp/sidebar";
import { useBreakpoint } from "@/lib/use-breakpoint";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const T = useT();
  const isMobile = useBreakpoint();
  const path = usePathname() ?? "/dashboard";
  const sub = path.replace(/^\/dashboard/, "") || "/";
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex" }}>
      <Sidebar active={sub} open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <main style={{ flex: 1, padding: isMobile ? "16px" : "32px 40px", overflow: "auto", minWidth: 0 }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: "none", border: `1px solid ${T.border}`, cursor: "pointer",
                padding: "7px 10px", borderRadius: 8, color: T.text1, fontSize: 18, lineHeight: 1,
              }}
            >☰</button>
            <Logo size={20}/>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
