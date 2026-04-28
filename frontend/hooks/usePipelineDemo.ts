"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActivationParticle,
  PipelineShardDef,
  PipelineShardState,
} from "@/components/pipeline/types";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function tSince(startMs: number) {
  const s = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
}

export const PIPELINE_SHARDS: PipelineShardDef[] = [
  { id: "shard-2", label: "L 0–10", x: 60 },
  { id: "shard-3", label: "L 11–20", x: 240 },
  { id: "shard-7", label: "L 21–30", x: 420 },
  { id: "shard-8", label: "L 31–32", x: 600 },
];

export function usePipelineDemo({ enabled = true }: { enabled?: boolean }) {
  const startMs = useRef(Date.now());
  const seq = useRef(0);

  const [shardStates, setShardStates] = useState<Record<string, PipelineShardState>>(
    () => ({
      "shard-2": "idle",
      "shard-3": "idle",
      "shard-7": "idle",
      "shard-8": "idle",
    }),
  );
  const [slashVisible, setSlashVisible] = useState(false);
  const [tps, setTps] = useState(0);
  const [curLayer, setCurLayer] = useState("—");
  const [tokenCount, setTokenCount] = useState(0);
  const [payoutEth, setPayoutEth] = useState(0);
  const [hashCount, setHashCount] = useState(0);
  const [particles, setParticles] = useState<ActivationParticle[]>([]);

  const spawn = (fromIdx: number, toIdx: number, failed = false) => {
    seq.current += 1;
    const id = `p-${Date.now()}-${seq.current}`;
    const start = Date.now();
    const durationMs = 550;
    setParticles((prev) => [
      ...prev,
      { id, fromIdx, toIdx, failed, startMs: start, durationMs },
    ]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, durationMs + 20);
  };

  useEffect(() => {
    if (!enabled) return;

    startMs.current = Date.now();
    setShardStates({
      "shard-2": "idle",
      "shard-3": "idle",
      "shard-7": "idle",
      "shard-8": "idle",
    });
    setSlashVisible(false);
    setTps(0);
    setCurLayer("—");
    setTokenCount(0);
    setPayoutEth(0);
    setHashCount(0);
    setParticles([]);

    const timers: number[] = [];
    const timer = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    // Start executing ~8s in (to line up with auction WIN beat).
    timer(() => {
      setShardStates((s) => ({
        ...s,
        "shard-2": "executing",
        "shard-3": "executing",
        "shard-7": "executing",
        "shard-8": "executing",
      }));
      setTps(24);
      setCurLayer("0–10");
    }, 7600);

    // Stream loop
    let streaming = true;
    const layerLabels = ["0–10", "11–20", "21–30", "31–32"];
    const streamLoop = (i: number) => {
      if (!streaming) return;
      spawn(i % 3, (i + 1) % 4, false);
      setTokenCount((n) => n + 1);
      setPayoutEth((p) => p + 0.012);
      setHashCount((h) => h + 1);
      setCurLayer(layerLabels[(i + 1) % 4] ?? "—");
      const id = window.setTimeout(() => streamLoop(i + 1), 320);
      timers.push(id);
    };

    timer(() => streamLoop(0), 7800);

    // Slashing moment ~12.5s
    timer(() => {
      setShardStates((s) => ({ ...s, "shard-3": "slashed" }));
      spawn(1, 2, true);
      setSlashVisible(true);
    }, 12500);

    // Failover/recovery ~13.8s
    timer(() => {
      setShardStates((s) => ({ ...s, "shard-3": "executing" }));
    }, 13800);

    // Banner fade ~14.6s
    timer(() => setSlashVisible(false), 14600);

    // Settle ~15.5s
    timer(() => {
      streaming = false;
      setTps(0);
      setCurLayer("done");
      setShardStates((s) => ({
        ...s,
        "shard-2": "done",
        "shard-3": "done",
        "shard-7": "done",
        "shard-8": "done",
      }));
    }, 15500);

    // Restart loop ~22s like the reference file
    timer(() => {
      // bump start so timestamps would read naturally if needed later
      startMs.current = Date.now();
    }, 22000);

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [enabled]);

  return useMemo(
    () => ({
      nowLabel: tSince(startMs.current),
      tps,
      curLayer,
      tokenCount,
      payoutEth,
      hashCount,
      shardStates,
      slashVisible,
      particles,
      spawn,
    }),
    [
      tps,
      curLayer,
      tokenCount,
      payoutEth,
      hashCount,
      shardStates,
      slashVisible,
      particles,
    ],
  );
}

