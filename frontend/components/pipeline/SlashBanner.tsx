"use client";

export function SlashBanner({
  visible,
  txHashLabel = "0xa3e2…b4f1",
}: {
  visible: boolean;
  txHashLabel?: string;
}) {
  return (
    <div
      className={[
        "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border border-[rgba(255,255,255,0.18)] bg-[var(--red)] px-7 py-3 text-center text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-all duration-300",
        visible ? "scale-100 opacity-100" : "scale-[0.8] opacity-0",
      ].join(" ")}
    >
      ⚡ Slashing tx fired
      <div className="mt-1 text-[9px] font-normal tracking-[0.08em] opacity-90">
        Shard-3 returned wrong activation · KeeperHub guaranteed execution ·{" "}
        <span className="underline decoration-dashed underline-offset-2">
          {txHashLabel}
        </span>
      </div>
    </div>
  );
}

