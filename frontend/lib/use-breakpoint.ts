"use client";
import { useState, useEffect } from "react";

export function useBreakpoint(px = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${px - 1}px)`);
    setMobile(mql.matches);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, [px]);
  return mobile;
}
