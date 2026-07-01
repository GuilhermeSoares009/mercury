import { loadSafetyConfig } from "./gate.ts";

let lastActionAt = 0;

export async function jitter(): Promise<void> {
  const cfg = loadSafetyConfig();
  if (!cfg.enabled || !cfg.delays) return;

  const now = Date.now();
  const elapsed = now - lastActionAt;
  const minMs = cfg.delays.minSeconds * 1000;
  const maxMs = cfg.delays.maxSeconds * 1000;

  if (lastActionAt > 0 && elapsed < minMs) {
    const wait = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    const remaining = Math.max(0, wait - elapsed);
    if (remaining > 0) {
      const secs = Math.ceil(remaining / 1000);
      console.error(`⏳ safety: waiting ${secs}s before next action...`);
      await new Promise((r) => setTimeout(r, remaining));
    }
  }

  lastActionAt = Date.now();
}

export function resetDelayTimer(): void {
  lastActionAt = 0;
}
