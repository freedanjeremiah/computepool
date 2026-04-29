import { ShardArt } from "./ShardArt";
import type { ShardListing } from "@/lib/marketplace";
import { LAYER_GROUP_COLOR, STATUS_COLOR, STATUS_LABEL } from "@/lib/marketplace";

export function ShardCard({
  shard,
  selected,
  onClick,
}: {
  shard: ShardListing;
  selected: boolean;
  onClick: () => void;
}) {
  const accentColor = LAYER_GROUP_COLOR[shard.layerGroup];
  const statusColor = STATUS_COLOR[shard.status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded border transition-colors flex flex-col gap-3 ${
        selected
          ? "border-[var(--border-soft)] bg-[var(--bg-elev)]"
          : "border-[var(--border)] bg-[var(--bg-panel)] hover:border-[var(--border-soft)] hover:bg-[var(--bg-elev)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <ShardArt num={shard.num} layerGroup={shard.layerGroup} size={64} />
        <div className="flex-1 min-w-0 flex flex-col gap-1 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-[var(--text)] truncate">
              Shard-{shard.num}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded border shrink-0"
              style={{
                color: accentColor,
                borderColor: `${accentColor}44`,
                background: `${accentColor}0d`,
              }}
            >
              {shard.layers}
            </span>
          </div>

          <span className="text-[10px] text-[var(--text-faint)] truncate">
            {shard.tokenId} · ERC-7857
          </span>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: statusColor }}
            />
            <span className="text-[10px]" style={{ color: statusColor }}>
              {STATUS_LABEL[shard.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] text-[var(--text-faint)] uppercase tracking-[0.1em]">
          <span>Reputation</span>
          <span>{shard.reputation}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-[var(--bg-elev)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${shard.reputation}%`,
              background:
                shard.reputation >= 92
                  ? "var(--green)"
                  : shard.reputation >= 85
                  ? "var(--yellow)"
                  : "var(--red)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[var(--text-faint)] uppercase tracking-[0.1em]">Bid</span>
          <span className="text-[13px] text-[var(--green)]">{shard.bidEth.toFixed(2)} ETH</span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[9px] text-[var(--text-faint)] uppercase tracking-[0.1em]">SLA</span>
          <span className="text-[12px] text-[var(--text-muted)]">{shard.slaSeconds}s</span>
        </div>
      </div>
    </button>
  );
}
