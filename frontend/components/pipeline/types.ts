export type PipelineShardState =
  | "idle"
  | "executing"
  | "slashed"
  | "done";

export type PipelineShardDef = {
  id: string;
  label: string;
  x: number;
};

export type ActivationParticle = {
  id: string;
  fromIdx: number;
  toIdx: number;
  failed: boolean;
  startMs: number;
  durationMs: number;
};

