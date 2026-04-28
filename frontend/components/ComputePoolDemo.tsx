"use client";

import { Header } from "@/components/header/Header";
import { PhaseTimeline } from "@/components/timeline/PhaseTimeline";
import { AXLMesh } from "@/components/mesh/AXLMesh";
import { AuctionArena } from "@/components/auction/AuctionArena";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { INFTWallet } from "@/components/wallet/INFTWallet";
import { useDemoLoop } from "@/hooks/useDemoLoop";

export function ComputePoolDemo() {
  const demo = useDemoLoop();

  return (
    <div className="mx-auto w-full max-w-[1280px] px-7 pb-[60px] pt-8">
      <Header playing={demo.playing} onPlay={demo.play} onReset={demo.reset} />

      <PhaseTimeline activeStep={demo.timelineStep} />

      <AXLMesh
        nodeStates={demo.meshNodeStates}
        linkStates={demo.meshLinkStates}
        activeChannels={demo.activeChannels}
        jobsInFlight={demo.jobsInFlight}
      />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.1fr_1.4fr]">
        <AuctionArena job={demo.job} rows={demo.auctionRows} leading={demo.leading} />
        <PipelineView
          tps={demo.tps}
          curLayer={demo.curLayer}
          tokenCount={demo.tokenCount}
          payoutEth={demo.payoutEth}
          hashCount={demo.hashCount}
          shardStates={demo.pipeShardStates}
          slashVisible={demo.slashVisible}
          particles={demo.particles}
        />
      </div>

      <INFTWallet
        royaltyEth={demo.royaltyEth}
        repWinPct={demo.repWinPct}
        repSlaPct={demo.repSlaPct}
        repWinWarn={demo.repWinWarn}
        repHistory={demo.repHistory}
      />

      <div className="mt-8 text-center text-[10px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
        <span
          className="text-[12px] normal-case tracking-normal text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          — frontend reference for ComputePool · OpenAgents 2026 —
        </span>
      </div>
    </div>
  );
}
