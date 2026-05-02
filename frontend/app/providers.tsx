"use client";

import * as React from "react";
import { ThemeProvider, buildTheme, PALETTES } from "@/components/cp/theme";
import { TweaksPanel } from "@/components/cp/tweaks-panel";
import { useTweaks } from "@/lib/use-tweaks";
import { InferProvider } from "@/lib/use-infer-state";
import { WalletProvider } from "@/lib/use-wallet";

export function Providers({ children }: { children: React.ReactNode }) {
  const [tweaks, set] = useTweaks();
  const palette = PALETTES[tweaks.palette] ?? PALETTES.emerald;
  const theme = React.useMemo(() => buildTheme(palette, tweaks.dark), [palette, tweaks.dark]);
  return (
    <ThemeProvider value={theme}>
      <WalletProvider>
        <InferProvider>
          {children}
          <TweaksPanel tweaks={tweaks} set={set}/>
        </InferProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
