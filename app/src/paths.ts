import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

/**
 * Central path resolution for Mercury.
 * Everything personal lives under ~/.mercury/ (overridable via MERCURY_HOME).
 */
export const MERCURY_HOME = process.env.MERCURY_HOME ?? join(homedir(), ".mercury");

export const paths = {
  home: MERCURY_HOME,
  db: join(MERCURY_HOME, "mercury.db"),
  config: join(MERCURY_HOME, "config.json"),
  /** Lockfile written by a running dashboard so the CLI can notify it of DB changes. */
  serverLock: join(MERCURY_HOME, "dashboard.lock"),
  /** Tailored resume artifacts default location (per-project override possible later). */
  artifacts: join(MERCURY_HOME, "artifacts"),
};

/** Ensure ~/.mercury/ and its subdirs exist. Safe to call repeatedly. */
export function ensureHome(): void {
  for (const dir of [paths.home, paths.artifacts]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

export interface MercuryConfig {
  /** LinkedIn username of the candidate (single-profile assumption for v1). */
  username?: string;
  displayName?: string;
  /** Default ACP provider id. */
  provider?: "opencode" | "claude-code";
  /** Optional explicit LinkedIn MCP connection command. */
  linkedinMcpCommand?: string[];
}

export function loadConfig(): MercuryConfig {
  if (!existsSync(paths.config)) return {};
  try {
    return JSON.parse(require("node:fs").readFileSync(paths.config, "utf8"));
  } catch {
    return {};
  }
}

export function saveConfig(cfg: MercuryConfig): void {
  ensureHome();
  require("node:fs").writeFileSync(paths.config, JSON.stringify(cfg, null, 2));
}
