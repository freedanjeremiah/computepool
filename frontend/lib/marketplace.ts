export type ShardStatus = "available" | "in-coalition" | "executing";
export type LayerGroup = "0-10" | "11-20" | "21-30" | "31+";
export type SortKey = "rep-desc" | "bid-asc" | "bid-desc" | "layer-asc";

export type ShardListing = {
  id: string;
  num: string;
  tokenId: string;
  axlPeerId: string;
  layers: string;
  layerGroup: LayerGroup;
  reputation: number;
  bidEth: number;
  slaSeconds: number;
  status: ShardStatus;
  models: string[];
  winHistory: ("w" | "l")[];
  slashedCount: number;
};

export const SHARD_LISTINGS: ShardListing[] = [
  {
    id: "shard-1",
    num: "01",
    tokenId: "0xA73f…0101",
    axlPeerId: "axl:peer:1f2a…a01",
    layers: "L 0–10",
    layerGroup: "0-10",
    reputation: 92,
    bidEth: 0.42,
    slaSeconds: 30,
    status: "available",
    models: ["Llama-7B", "Llama-3B"],
    winHistory: ["w","w","w","l","w","w","w","w","w","w","w","w"],
    slashedCount: 1,
  },
  {
    id: "shard-2",
    num: "02",
    tokenId: "0xA73f…0202",
    axlPeerId: "axl:peer:9c11…b77",
    layers: "L 0–10",
    layerGroup: "0-10",
    reputation: 89,
    bidEth: 0.36,
    slaSeconds: 30,
    status: "in-coalition",
    models: ["Llama-7B", "Qwen-3B"],
    winHistory: ["w","w","l","w","w","l","w","w","w","w","w","w"],
    slashedCount: 2,
  },
  {
    id: "shard-3",
    num: "03",
    tokenId: "0xA73f…0303",
    axlPeerId: "axl:peer:2d88…19c",
    layers: "L 11–20",
    layerGroup: "11-20",
    reputation: 86,
    bidEth: 0.38,
    slaSeconds: 28,
    status: "executing",
    models: ["Llama-7B"],
    winHistory: ["w","l","w","w","l","w","w","l","w","w","w","w"],
    slashedCount: 3,
  },
  {
    id: "shard-4",
    num: "04",
    tokenId: "0xA73f…0404",
    axlPeerId: "axl:peer:aa03…e21",
    layers: "L 11–20",
    layerGroup: "11-20",
    reputation: 90,
    bidEth: 0.30,
    slaSeconds: 32,
    status: "available",
    models: ["Llama-7B", "Llama-3B", "Qwen-3B"],
    winHistory: ["w","w","w","w","l","w","w","w","w","w","w","w"],
    slashedCount: 1,
  },
  {
    id: "shard-5",
    num: "05",
    tokenId: "0xA73f…0505",
    axlPeerId: "axl:peer:4b0a…4dd",
    layers: "L 21–30",
    layerGroup: "21-30",
    reputation: 94,
    bidEth: 0.33,
    slaSeconds: 25,
    status: "available",
    models: ["Llama-7B", "Llama-3B"],
    winHistory: ["w","w","w","w","w","l","w","w","w","w","w","w"],
    slashedCount: 0,
  },
  {
    id: "shard-6",
    num: "06",
    tokenId: "0xA73f…0606",
    axlPeerId: "axl:peer:0f7c…991",
    layers: "L 21–30",
    layerGroup: "21-30",
    reputation: 88,
    bidEth: 0.29,
    slaSeconds: 35,
    status: "available",
    models: ["Llama-3B", "Qwen-3B"],
    winHistory: ["w","w","l","w","w","w","l","w","w","w","w","w"],
    slashedCount: 1,
  },
  {
    id: "shard-7",
    num: "07",
    tokenId: "0xA73f…891c",
    axlPeerId: "axl:peer:7e12…0c3",
    layers: "L 21–30",
    layerGroup: "21-30",
    reputation: 96,
    bidEth: 0.32,
    slaSeconds: 25,
    status: "available",
    models: ["Llama-7B", "Llama-3B", "Qwen-3B"],
    winHistory: ["w","w","w","w","w","w","w","l","w","w","w","w"],
    slashedCount: 0,
  },
  {
    id: "shard-8",
    num: "08",
    tokenId: "0xA73f…0808",
    axlPeerId: "axl:peer:0aa1…2fe",
    layers: "L 31–32",
    layerGroup: "31+",
    reputation: 91,
    bidEth: 0.05,
    slaSeconds: 30,
    status: "in-coalition",
    models: ["Llama-7B", "Llama-3B", "Qwen-3B"],
    winHistory: ["w","w","w","l","w","w","w","w","w","w","w","w"],
    slashedCount: 1,
  },
];

export const LAYER_GROUP_COLOR: Record<LayerGroup, string> = {
  "0-10":  "#5ec8ff",
  "11-20": "#ffb300",
  "21-30": "#00ff9c",
  "31+":   "#b39dff",
};

export const STATUS_LABEL: Record<ShardStatus, string> = {
  "available":    "available",
  "in-coalition": "in coalition",
  "executing":    "executing",
};

export const STATUS_COLOR: Record<ShardStatus, string> = {
  "available":    "#00ff9c",
  "in-coalition": "#b39dff",
  "executing":    "#5ec8ff",
};

export function sortShards(shards: ShardListing[], key: SortKey): ShardListing[] {
  return [...shards].sort((a, b) => {
    if (key === "rep-desc")  return b.reputation - a.reputation;
    if (key === "bid-asc")   return a.bidEth - b.bidEth;
    if (key === "bid-desc")  return b.bidEth - a.bidEth;
    if (key === "layer-asc") return a.layerGroup.localeCompare(b.layerGroup);
    return 0;
  });
}
