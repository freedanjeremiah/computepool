"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type NodeState = "idle" | "bidding" | "coalition" | "executing" | "slashed" | "done";
type LinkState = "inactive" | "active" | "coalition";

type MeshNode = {
  id: string;
  x: number;
  y: number;
  role: string;
  tokenId: string;
  axlPeerId: string;
  reputation: number;
  state: NodeState;
};

type MeshLink = {
  a: number;
  b: number;
  state: LinkState;
  untilMs?: number;
};

const nodeColors: Record<NodeState, { fill: string; stroke: string; r: number }> = {
  idle: { fill: "#16161a", stroke: "#44444c", r: 8 },
  bidding: { fill: "#3a2a00", stroke: "#ffb300", r: 8 },
  coalition: { fill: "#2a1f4a", stroke: "#b39dff", r: 8 },
  executing: { fill: "#0a3a4a", stroke: "#5ec8ff", r: 9 },
  slashed: { fill: "#3a0a14", stroke: "#ff4f6e", r: 8 },
  done: { fill: "#0a3322", stroke: "#00ff9c", r: 8 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AXLMesh() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const [nodes, setNodes] = useState<MeshNode[]>(() => [
    { id: "shard-1", x: 80, y: 100, role: "L 0–10", tokenId: "0xA73f…0101 · #01", axlPeerId: "axl:peer:1f2a…a01", reputation: 92, state: "idle" },
    { id: "shard-2", x: 220, y: 50, role: "L 0–10", tokenId: "0xA73f…0202 · #02", axlPeerId: "axl:peer:9c11…b77", reputation: 89, state: "idle" },
    { id: "shard-3", x: 360, y: 130, role: "L 11–20", tokenId: "0xA73f…0303 · #03", axlPeerId: "axl:peer:2d88…19c", reputation: 86, state: "idle" },
    { id: "shard-4", x: 500, y: 60, role: "L 11–20", tokenId: "0xA73f…0404 · #04", axlPeerId: "axl:peer:aa03…e21", reputation: 90, state: "idle" },
    { id: "shard-5", x: 640, y: 100, role: "L 21–30", tokenId: "0xA73f…0505 · #05", axlPeerId: "axl:peer:4b0a…4dd", reputation: 94, state: "idle" },
    { id: "shard-6", x: 780, y: 40, role: "L 21–30", tokenId: "0xA73f…0606 · #06", axlPeerId: "axl:peer:0f7c…991", reputation: 88, state: "idle" },
    { id: "shard-7", x: 920, y: 130, role: "L 21–30", tokenId: "0xA73f…891c · #07", axlPeerId: "axl:peer:7e12…0c3", reputation: 96, state: "idle" },
    { id: "shard-8", x: 1080, y: 90, role: "L 31–32", tokenId: "0xA73f…0808 · #08", axlPeerId: "axl:peer:0aa1…2fe", reputation: 91, state: "idle" },
  ]);

  const [links, setLinks] = useState<MeshLink[]>(() => [
    { a: 0, b: 1, state: "inactive" },
    { a: 0, b: 2, state: "inactive" },
    { a: 1, b: 2, state: "inactive" },
    { a: 1, b: 3, state: "inactive" },
    { a: 2, b: 3, state: "inactive" },
    { a: 2, b: 4, state: "inactive" },
    { a: 3, b: 4, state: "inactive" },
    { a: 3, b: 5, state: "inactive" },
    { a: 4, b: 5, state: "inactive" },
    { a: 4, b: 6, state: "inactive" },
    { a: 5, b: 6, state: "inactive" },
    { a: 5, b: 7, state: "inactive" },
    { a: 6, b: 7, state: "inactive" },
  ]);

  const activeChannels = useMemo(
    () => links.reduce((n, l) => n + (l.state === "active" ? 1 : 0), 0),
    [links],
  );

  // lightweight mocked activity pulse to make the mesh feel alive
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();

      setLinks((prev) => {
        const cleaned: MeshLink[] = prev.map((l) =>
          l.untilMs && l.untilMs <= now
            ? { ...l, state: "inactive" as const, untilMs: undefined }
            : l,
        );
        const pick = Math.floor(Math.random() * cleaned.length);
        const pulseFor = 650;
        return cleaned.map((l, i) =>
          i === pick ? { ...l, state: "active" as const, untilMs: now + pulseFor } : l,
        );
      });

      // also nudge a couple nodes into "bidding"/"coalition"/"executing" occasionally
      setNodes((prev) => {
        const roll = Math.random();
        if (roll < 0.6) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        const next: NodeState =
          roll < 0.75 ? "bidding" : roll < 0.9 ? "coalition" : "executing";
        return prev.map((n, i) => (i === idx ? { ...n, state: next } : n));
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, []);

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const tooltip = hoveredNodeIdx != null ? nodes[hoveredNodeIdx] : null;
  const tooltipPos = useMemo(() => {
    if (!mouse) return null;
    const pad = 12;
    const w = 320;
    const h = 106;
    return {
      left: clamp(mouse.x + 14, pad, Math.max(pad, (containerRef.current?.clientWidth ?? 0) - w - pad)),
      top: clamp(mouse.y + 14, pad, Math.max(pad, (containerRef.current?.clientHeight ?? 0) - h - pad)),
      w,
    };
  }, [mouse]);

  return (
    <section
      className="border border-[var(--border)] bg-[var(--bg-panel)]"
      aria-label="AXL Mesh"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
        <span>◆ AXL Mesh · Live</span>
        <div className="flex gap-[18px]">
          <span>
            Nodes <b className="ml-1 font-medium text-[var(--text)]">{nodes.length}</b>
          </span>
          <span>
            Active channels{" "}
            <b className="ml-1 font-medium text-[var(--text)]">{activeChannels}</b>
          </span>
          <span>
            Jobs in flight <b className="ml-1 font-medium text-[var(--text)]">0</b>
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[180px]"
        onMouseMove={onMouseMove}
        onMouseLeave={() => {
          setHoveredNodeIdx(null);
          setMouse(null);
        }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 180"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="AXL mesh graph"
        >
          {links.map((l, i) => {
            const A = nodes[l.a];
            const B = nodes[l.b];
            const isActive = l.state === "active";
            const isCoalition = l.state === "coalition";
            return (
              <line
                key={i}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                strokeDasharray="3 4"
                className={[
                  "transition-[stroke,stroke-width] duration-300",
                  isActive ? "stroke-[var(--green)] stroke-[1.4]" : "",
                  isCoalition ? "stroke-[var(--purple)] stroke-[2]" : "",
                  !isActive && !isCoalition ? "stroke-[var(--border-soft)] stroke-[1]" : "",
                  isActive ? "[animation:meshDash_1s_linear_infinite]" : "",
                ].join(" ")}
              />
            );
          })}

          {nodes.map((n, idx) => {
            const col = nodeColors[n.state];
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                onMouseEnter={() => setHoveredNodeIdx(idx)}
                onFocus={() => setHoveredNodeIdx(idx)}
              >
                <circle
                  r={col.r}
                  fill={col.fill}
                  stroke={col.stroke}
                  strokeWidth={1.5}
                  className="transition-[fill,stroke,r] duration-300"
                />
                <text
                  y={24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize={9}
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-4 flex gap-4 text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
          <LegendDot label="Idle" color="var(--text-faint)" />
          <LegendDot label="Bidding" color="var(--yellow)" />
          <LegendDot label="Coalition" color="var(--purple)" />
          <LegendDot label="Executing" color="var(--blue)" />
          <LegendDot label="Slashed" color="var(--red)" />
        </div>

        {/* Tooltip */}
        {tooltip && tooltipPos && (
          <div
            className="pointer-events-none absolute z-10 w-[320px] border border-[var(--border-soft)] bg-[var(--bg-elev)] px-3 py-2 text-[11px]"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
          >
            <div className="mb-1 flex items-baseline justify-between">
              <div className="text-[12px] font-medium text-[var(--text)]">
                {tooltip.id} <span className="ml-2 text-[var(--text-muted)]">{tooltip.role}</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                {tooltip.state}
              </div>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-[var(--text-muted)]">
              <div className="text-[var(--text-faint)]">Reputation</div>
              <div className="text-[var(--text)]">{tooltip.reputation}%</div>
              <div className="text-[var(--text-faint)]">iNFT</div>
              <div className="text-[var(--text)]">{tooltip.tokenId}</div>
              <div className="text-[var(--text-faint)]">AXL peer</div>
              <div className="text-[var(--text)]">{tooltip.axlPeerId}</div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes meshDash {
          to {
            stroke-dashoffset: -10;
          }
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 156, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(0, 255, 156, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 156, 0);
          }
        }
      `}</style>
    </section>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

