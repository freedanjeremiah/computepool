const KEY_USERNAME  = "cp_username";
const KEY_API_KEY   = "cp_api_key";
const KEY_DEMO_KEY  = "cp_demo_payer_key";
const KEY_CHAIN_ID  = "cp_chain_id";

export function saveAuth(username: string, apiKey: string): void {
  localStorage.setItem(KEY_USERNAME, username);
  localStorage.setItem(KEY_API_KEY, apiKey);
}

export function loadAuth(): { username: string; apiKey: string } | null {
  const username = localStorage.getItem(KEY_USERNAME);
  const apiKey   = localStorage.getItem(KEY_API_KEY);
  if (!username || !apiKey) return null;
  return { username, apiKey };
}

export function clearAuth(): void {
  localStorage.removeItem(KEY_USERNAME);
  localStorage.removeItem(KEY_API_KEY);
}

export function saveDemoPayerKey(key: string): void {
  localStorage.setItem(KEY_DEMO_KEY, key);
}

export function loadDemoPayerKey(): string | null {
  return localStorage.getItem(KEY_DEMO_KEY);
}

export function clearDemoPayerKey(): void {
  localStorage.removeItem(KEY_DEMO_KEY);
}

export function saveChainId(id: number): void {
  localStorage.setItem(KEY_CHAIN_ID, String(id));
}

export function loadChainId(): number {
  const v = localStorage.getItem(KEY_CHAIN_ID);
  return v ? parseInt(v, 10) : 16602;
}
