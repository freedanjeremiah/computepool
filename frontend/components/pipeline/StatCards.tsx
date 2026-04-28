"use client";

export function StatCards({
  tokenCount,
  payoutEth,
  hashCount,
}: {
  tokenCount: number;
  payoutEth: number;
  hashCount: number;
}) {
  return (
    <div className="mt-[18px] grid grid-cols-3 gap-3">
      <StatCard label="Output tokens" value={`${tokenCount}`} unit="streamed" />
      <StatCard
        keeperhub
        label="KeeperHub payouts"
        value={payoutEth.toFixed(3)}
        unit="ETH"
      />
      <StatCard label="Activation hashes" value={`${hashCount}`} unit="on 0G" />
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  keeperhub = false,
}: {
  label: string;
  value: string;
  unit: string;
  keeperhub?: boolean;
}) {
  return (
    <div className="border border-[var(--border-soft)] bg-[var(--bg-elev)] px-3 py-2.5">
      <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
        {keeperhub ? <span className="mr-1 text-[var(--green)]">◆</span> : null}
        {label}
      </div>
      <div
        className={[
          "text-[15px] tabular-nums",
          keeperhub ? "text-[var(--green)]" : "text-[var(--text)]",
        ].join(" ")}
      >
        {value}
        <span className="ml-1 text-[11px] text-[var(--text-muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}

