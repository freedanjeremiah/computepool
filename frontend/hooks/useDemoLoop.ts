"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MESH_LINKS, DEFAULT_MESH_NODES } from "@/lib/constants";
import { PIPELINE_SHARDS } from "@/lib/pipeline";
import type { AuctionJob, AuctionLeading, AuctionLogRow } from "@/components/auction/types";
import type { ActivationParticle } from "@/components/pipeline/types";
import type { MeshLinkState, MeshNodeState } from "@/lib/constants";
import type { PipelineShardState } from "@/components/pipeline/types";

function linkKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function idxToMeshId(idx: number) {
  return DEFAULT_MESH_NODES[idx]?.id;
}

function pipeIdxToId(idx: number) {
  return PIPELINE_SHARDS[idx]?.id;
}

const INITIAL_LINKS: Record<string, MeshLinkState> = Object.fromEntries(
  DEFAULT_MESH_LINKS.map((l) => [linkKey(l.a, l.b), "inactive" as const]),
);

const INITIAL_MESH_NODE_STATES: Record<string, MeshNodeState> = Object.fromEntries(
  DEFAULT_MESH_NODES.map((n) => [n.id, "idle" as const]),
);

const INITIAL_PIPE_STATES: Record<string, PipelineShardState> = {
  "shard-2": "idle",
  "shard-3": "idle",
  "shard-7": "idle",
  "shard-8": "idle",
};

export function useDemoLoop() {
  const timersRef = useRef<number[]>([]);
  const streamTimerRef = useRef<number | null>(null);
  const royaltyTimerRef = useRef<number | null>(null);
  const rowSeq = useRef(0);
  const particleSeq = useRef(0);
  const playingRef = useRef(true);

  const [playing, setPlaying] = useState(true);
  const [timelineStep, setTimelineStep] = useState(0);

  const [meshNodeStates, setMeshNodeStates] = useState<Record<string, MeshNodeState>>(
    () => ({ ...INITIAL_MESH_NODE_STATES }),
  );
  const [meshLinkStates, setMeshLinkStates] = useState<Record<string, MeshLinkState>>(
    () => ({ ...INITIAL_LINKS }),
  );
  const [activeChannels, setActiveChannels] = useState("0");
  const [jobsInFlight, setJobsInFlight] = useState("0");

  const [job, setJob] = useState<AuctionJob>(() => ({
    round: "—",
    jobId: "awaiting…",
    model: "—",
    budgetEth: "—",
    deadline: "—",
  }));
  const [auctionRows, setAuctionRows] = useState<AuctionLogRow[]>([]);
  const [leading, setLeading] = useState<AuctionLeading>({
    leadingBid: "—",
    leadingCoalition: "—",
  });

  const [tps, setTps] = useState(0);
  const [curLayer, setCurLayer] = useState("—");
  const [tokenCount, setTokenCount] = useState(0);
  const [payoutEth, setPayoutEth] = useState(0);
  const [hashCount, setHashCount] = useState(0);
  const [pipeShardStates, setPipeShardStates] =
    useState<Record<string, PipelineShardState>>(() => ({ ...INITIAL_PIPE_STATES }));
  const [slashVisible, setSlashVisible] = useState(false);
  const [particles, setParticles] = useState<ActivationParticle[]>([]);

  const [royaltyEth, setRoyaltyEth] = useState(0);
  const [repWinPct, setRepWinPct] = useState(94);
  const [repSlaPct, setRepSlaPct] = useState(98);
  const [repWinWarn, setRepWinWarn] = useState(false);
  const [repHistory, setRepHistory] = useState<string>(() =>
    ["w", "w", "w", "w", "w", "w", "w", "l", "w", "w", "w", "w"].join(""),
  );

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (streamTimerRef.current) {
      window.clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    if (royaltyTimerRef.current) {
      window.clearInterval(royaltyTimerRef.current);
      royaltyTimerRef.current = null;
    }
  }, []);

  const pushLog = useCallback((row: Omit<AuctionLogRow, "id">) => {
    rowSeq.current += 1;
    const id = `${Date.now()}-${rowSeq.current}`;
    setAuctionRows((prev) => {
      const next = [...prev, { ...row, id }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  const activateLink = useCallback((a: number, b: number, type: MeshLinkState = "active") => {
    const k = linkKey(a, b);
    setMeshLinkStates((prev) => ({ ...prev, [k]: type }));
    if (type === "active") {
      const tid = window.setTimeout(() => {
        setMeshLinkStates((prev) =>
          prev[k] === "active" ? { ...prev, [k]: "inactive" } : prev,
        );
      }, 650);
      timersRef.current.push(tid);
    }
  }, []);

  const setMeshIdxState = useCallback((idx: number, state: MeshNodeState) => {
    const id = idxToMeshId(idx);
    if (!id) return;
    setMeshNodeStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const setPipeIdxState = useCallback((idx: number, state: PipelineShardState) => {
    const id = pipeIdxToId(idx);
    if (!id) return;
    setPipeShardStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const spawnParticle = useCallback((fromIdx: number, toIdx: number, failed = false) => {
    if (toIdx >= PIPELINE_SHARDS.length) return;
    particleSeq.current += 1;
    const id = `p-${Date.now()}-${particleSeq.current}`;
    const startMs = Date.now();
    const durationMs = 550;
    setParticles((prev) => [
      ...prev,
      { id, fromIdx, toIdx, failed, startMs, durationMs },
    ]);
    const tid = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, durationMs + 20);
    timersRef.current.push(tid);
  }, []);

  const resetVisualState = useCallback(() => {
    clearTimers();
    setTimelineStep(0);
    setMeshNodeStates({ ...INITIAL_MESH_NODE_STATES });
    setMeshLinkStates({ ...INITIAL_LINKS });
    setActiveChannels("0");
    setJobsInFlight("0");
    setJob({
      round: "—",
      jobId: "awaiting…",
      model: "—",
      budgetEth: "—",
      deadline: "—",
    });
    setAuctionRows([]);
    setLeading({ leadingBid: "—", leadingCoalition: "—" });
    setTps(0);
    setCurLayer("—");
    setTokenCount(0);
    setPayoutEth(0);
    setHashCount(0);
    setPipeShardStates({ ...INITIAL_PIPE_STATES });
    setSlashVisible(false);
    setParticles([]);
    setRoyaltyEth(0);
    setRepWinPct(94);
    setRepSlaPct(98);
    setRepWinWarn(false);
    setRepHistory(["w", "w", "w", "w", "w", "w", "w", "l", "w", "w", "w", "w"].join(""));
  }, [clearTimers]);

  const scheduleDemo = useCallback(() => {
    clearTimers();
    resetVisualState();

    const t = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    t(() => {
      setTimelineStep(1);
      setJob({
        round: "#247",
        jobId: "job_0x91c4",
        model: "Llama-7B",
        budgetEth: "0.95",
        deadline: "30s",
      });
      setJobsInFlight("1");
      pushLog({
        t: "00:00",
        agent: "client",
        agentTone: "b",
        verb: "POST_JOB",
        body: "Llama-7B · max 0.95 ETH · deadline 30s",
      });
    }, 600);

    t(() => {
      setTimelineStep(2);
      [0, 1].forEach((i) => setMeshIdxState(i, "bidding"));
      setActiveChannels("4");
      activateLink(0, 1);
      activateLink(1, 2);
      pushLog({
        t: "00:01",
        agent: "shard-1",
        verb: "OFFER",
        body: "0.42 ETH · layers 0–10",
      });
    }, 1400);

    t(() => {
      setMeshIdxState(2, "bidding");
      setActiveChannels("6");
      activateLink(1, 2);
      activateLink(2, 3);
      pushLog({
        t: "00:01",
        agent: "shard-2",
        verb: "COUNTER",
        body: "0.36 ETH · layers 0–10 ⚡",
      });
      setLeading({ leadingBid: "0.36 ETH", leadingCoalition: "shard-2" });
    }, 2000);

    t(() => {
      [3, 4].forEach((i) => setMeshIdxState(i, "bidding"));
      activateLink(2, 4);
      activateLink(3, 5);
      pushLog({
        t: "00:02",
        agent: "shard-4",
        verb: "OFFER",
        body: "0.30 ETH · layers 11–20",
      });
    }, 2600);

    t(() => {
      setTimelineStep(3);
      [1, 3, 6, 7].forEach((i) => setMeshIdxState(i, "coalition"));
      activateLink(1, 3, "coalition");
      activateLink(3, 6, "coalition");
      activateLink(6, 7, "coalition");
      setActiveChannels("9");
      pushLog({
        t: "00:03",
        agent: "shard-2",
        agentTone: "p",
        verb: "COALITION_INVITE",
        body: "→ shard-4, shard-7, shard-8",
      });
    }, 3200);

    t(() => {
      pushLog({
        t: "00:03",
        agent: "shard-4",
        agentTone: "p",
        verb: "JOIN",
        body: "layers 11–20 · 0.30 ETH",
      });
    }, 3800);

    t(() => {
      pushLog({
        t: "00:04",
        agent: "shard-7",
        agentTone: "p",
        verb: "JOIN",
        body: "layers 21–30 · 0.32 ETH",
      });
    }, 4300);

    t(() => {
      pushLog({
        t: "00:04",
        agent: "shard-8",
        agentTone: "p",
        verb: "JOIN",
        body: "layers 31–32 · 0.05 ETH",
      });
      setLeading({ leadingBid: "0.97 ETH", leadingCoalition: "A · 4 shards" });
    }, 4800);

    t(() => {
      pushLog({
        t: "00:05",
        agent: "coalition-A",
        agentTone: "p",
        verb: "BID",
        body: "0.97 ETH · 4 shards · 28s SLA",
      });
    }, 5300);

    t(() => {
      pushLog({
        t: "00:05",
        agent: "coalition-B",
        agentTone: "p",
        verb: "COUNTER",
        body: "0.91 ETH · 3 shards · 30s SLA",
      });
      setLeading({ leadingBid: "0.91 ETH", leadingCoalition: "B · 3 shards" });
    }, 5800);

    t(() => {
      pushLog({
        t: "00:06",
        agent: "coalition-A",
        agentTone: "p",
        verb: "BID",
        body: "0.88 ETH · 4 shards · 25s SLA ⚡",
      });
      setLeading({ leadingBid: "0.88 ETH", leadingCoalition: "A · 4 shards" });
    }, 6300);

    t(() => {
      pushLog({
        t: "00:07",
        agent: "matchmaker",
        agentTone: "b",
        verb: "WIN",
        body: "coalition-A @ 0.88 ETH · contract committed",
        win: true,
      });
    }, 6900);

    t(() => {
      setTimelineStep(4);
      [1, 3, 6, 7].forEach((i) => setMeshIdxState(i, "executing"));
      [0, 1, 2, 3].forEach((i) => setPipeIdxState(i, "executing"));
      setCurLayer("0–10");
      setTps(24);
    }, 7600);

    let streamLayer = 0;
    let streaming = true;
    const streamLoop = () => {
      if (!streaming || !playingRef.current) return;
      spawnParticle(streamLayer % 3, (streamLayer + 1) % 4, false);
      setTokenCount((n) => n + 1);
      setPayoutEth((p) => p + 0.012);
      setHashCount((h) => h + 1);
      if ((streamLayer + 1) % 4 < 3) {
        const labels = ["0–10", "11–20", "21–30", "31–32"];
        setCurLayer(labels[(streamLayer + 1) % 4] ?? "—");
      }
      streamLayer += 1;
      streamTimerRef.current = window.setTimeout(streamLoop, 320);
    };
    t(() => streamLoop(), 7800);

    t(() => {
      setTimelineStep(5);
      setPipeIdxState(1, "slashed");
      setMeshIdxState(3, "slashed");
      spawnParticle(1, 2, true);
      setSlashVisible(true);
      pushLog({
        t: "00:14",
        agent: "arbiter",
        agentTone: "r",
        verb: "BREACH",
        body: "shard-3 · activation hash mismatch on layer 14",
      });
      setRepWinPct(78);
      setRepWinWarn(true);
    }, 12500);

    t(() => {
      pushLog({
        t: "00:14",
        agent: "KeeperHub",
        agentTone: "r",
        verb: "SLASH_TX",
        body: "0xa3e2…b4f1 · 0.18 ETH bond seized",
      });
    }, 13100);

    t(() => {
      pushLog({
        t: "00:15",
        agent: "matchmaker",
        agentTone: "b",
        verb: "FAILOVER",
        body: "shard-5 takes layers 11–20",
      });
      setMeshIdxState(2, "executing");
      setPipeIdxState(1, "executing");
    }, 13800);

    t(() => setSlashVisible(false), 14600);

    t(() => {
      setTimelineStep(6);
      streaming = false;
      if (streamTimerRef.current) {
        window.clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      [1, 2, 6, 7].forEach((i) => setMeshIdxState(i, "done"));
      [0, 1, 2, 3].forEach((i) => setPipeIdxState(i, "done"));
      setTps(0);
      setCurLayer("done");
      pushLog({
        t: "00:24",
        agent: "KeeperHub",
        agentTone: "b",
        verb: "SETTLE",
        body: "0.88 ETH split across 4 iNFT holders",
        win: true,
      });
    }, 15500);

    t(() => {
      const target = 0.2376;
      let cur = 0;
      royaltyTimerRef.current = window.setInterval(() => {
        cur = Math.min(target, cur + target / 32);
        setRoyaltyEth(cur);
        if (cur >= target && royaltyTimerRef.current) {
          window.clearInterval(royaltyTimerRef.current);
          royaltyTimerRef.current = null;
        }
      }, 40);
    }, 16200);

    t(() => {
      pushLog({
        t: "00:25",
        agent: "shard-7",
        agentTone: "b",
        verb: "ROYALTY",
        body: "0.2376 ETH → iNFT #07 holder",
      });
      setRepHistory(
        ["w", "w", "w", "w", "w", "w", "w", "l", "w", "w", "w", "w", "w"].join(""),
      );
    }, 17000);

    t(() => {
      if (!playingRef.current) return;
      scheduleDemo();
    }, 22000);
  }, [
    activateLink,
    clearTimers,
    pushLog,
    resetVisualState,
    setMeshIdxState,
    setPipeIdxState,
    spawnParticle,
  ]);

  useEffect(() => {
    scheduleDemo();
    return () => clearTimers();
  }, [scheduleDemo, clearTimers]);

  const play = useCallback(() => {
    playingRef.current = true;
    setPlaying(true);
    clearTimers();
    resetVisualState();
    scheduleDemo();
  }, [clearTimers, resetVisualState, scheduleDemo]);

  const reset = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    clearTimers();
    resetVisualState();
  }, [clearTimers, resetVisualState]);

  return useMemo(
    () => ({
      playing,
      play,
      reset,
      timelineStep,
      meshNodeStates,
      meshLinkStates,
      activeChannels,
      jobsInFlight,
      job,
      auctionRows,
      leading,
      tps,
      curLayer,
      tokenCount,
      payoutEth,
      hashCount,
      pipeShardStates,
      slashVisible,
      particles,
      royaltyEth,
      repWinPct,
      repSlaPct,
      repWinWarn,
      repHistory,
    }),
    [
      playing,
      play,
      reset,
      timelineStep,
      meshNodeStates,
      meshLinkStates,
      activeChannels,
      jobsInFlight,
      job,
      auctionRows,
      leading,
      tps,
      curLayer,
      tokenCount,
      payoutEth,
      hashCount,
      pipeShardStates,
      slashVisible,
      particles,
      royaltyEth,
      repWinPct,
      repSlaPct,
      repWinWarn,
      repHistory,
    ],
  );
}
