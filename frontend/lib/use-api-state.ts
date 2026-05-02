"use client";

import * as React from "react";
import { state as apiState, type ApiState } from "@/lib/api";
import { loadAuth } from "@/lib/auth-store";

type UseApiStateOptions = { pollMs?: number };

export type UseApiStateResult = {
  data: ApiState | null;
  error: string | null;
  loading: boolean;
  authed: boolean;
  refresh: () => Promise<void>;
};

/** Polls /api/state at ``pollMs`` (default 10s). Returns null when no api-key. */
export function useApiState(opts: UseApiStateOptions = {}): UseApiStateResult {
  const pollMs = opts.pollMs ?? 10_000;
  const [data, setData] = React.useState<ApiState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  const fetchOnce = React.useCallback(async () => {
    const a = loadAuth();
    setAuthed(!!a);
    if (!a) {
      setLoading(false);
      setData(null);
      return;
    }
    try {
      const s = await apiState.get();
      setData(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    void fetchOnce();
    const id = setInterval(() => {
      if (alive) void fetchOnce();
    }, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [fetchOnce, pollMs]);

  return { data, error, loading, authed, refresh: fetchOnce };
}
