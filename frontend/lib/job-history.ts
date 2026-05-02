// localStorage-backed job history. Drives /dashboard/jobs and /payments,
// and persists each completed inference so the user can browse it later.

export type JobRecord = {
  request_id: string;
  pool: string;
  model: string;
  prompt: string;
  status: "complete" | "error";
  tokens?: number;
  duration_s?: number;
  cost_usdc?: number;
  output?: string;
  payer?: string;
  settle_tx?: string;
  error?: string;
  ts: number; // ms epoch when it finished
};

const KEY = "cp_job_history_v1";
const MAX = 100;

export function listJobs(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

export function saveJob(j: JobRecord): void {
  if (typeof window === "undefined") return;
  const all = listJobs();
  const next = [j, ...all.filter((x) => x.request_id !== j.request_id)].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearJobs(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function totalsByWindow(jobs: JobRecord[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const sum = (since: number) =>
    jobs.filter((j) => j.ts >= since && j.cost_usdc != null)
        .reduce((a, j) => a + (j.cost_usdc ?? 0), 0);
  return {
    today: sum(now - day),
    week: sum(now - 7 * day),
    month: sum(now - 30 * day),
    all: sum(0),
  };
}

export function ago(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
