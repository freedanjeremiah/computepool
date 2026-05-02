"use client";

import * as React from "react";

export type Tweaks = {
  palette: string;
  dark: boolean;
  showCoalition: boolean;
};

const DEFAULTS: Tweaks = {
  palette: "emerald",
  dark: false,
  showCoalition: true,
};

const KEY = "cp_tweaks_v1";

export function useTweaks(): [Tweaks, <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void] {
  const [state, setState] = React.useState<Tweaks>(DEFAULTS);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Tweaks>;
        setState({ ...DEFAULTS, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const set = React.useCallback(<K extends keyof Tweaks>(k: K, v: Tweaks[K]) => {
    setState((prev) => {
      const next = { ...prev, [k]: v };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return [state, set];
}
