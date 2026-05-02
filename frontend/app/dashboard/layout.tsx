"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/cp/theme";
import { Sidebar } from "@/components/cp/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const T = useT();
  const path = usePathname() ?? "/dashboard";
  const sub = path.replace(/^\/dashboard/, "") || "/";
  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex" }}>
      <Sidebar active={sub}/>
      <main style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
