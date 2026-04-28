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
      <div className="border border-[var(--border-soft)] bg-[var(--bg-elev)] px-3 py-2.5">
        <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
          Output tokens
        </div>
        <div className="text-[15px] text-[var(--text)]">
          {tokenCount}
          <span className="ml-1 text-[11px] text-[var(--text-muted)]">streamed</span>
        </div>
      </div>
      <div className="border border-[var(--border-soft)] bg-[var(--bg-elev)] px-3 py-2.5">
        <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
          <span className="mr-1 text-[var(--green)]">◆</span>
          KeeperHub payouts
        </div>
        <div className="text-[15px] text-[var(--green)]">
          {payoutEth.toFixed(3)}
          <span className="ml-1 text-[11px] text-[var(--text-muted)]">ETH</span>
        </div>
      </div>
      <div className="border border-[var(--border-soft)] bg-[var(--bg-elev)] px-3 py-2.5">
        <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
          Activation hashes
        </div>
        <div className="text-[15px] text-[var(--text)]">
          {hashCount}
          <span className="ml-1 text-[11px] text-[var(--text-muted)]">on 0G</span>
        </div>
      </div>
    </div>
  );
}
