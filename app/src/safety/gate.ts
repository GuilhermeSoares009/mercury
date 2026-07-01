import { db } from "../db/index.ts";
import { loadConfig, saveConfig } from "../paths.ts";
import { jitter } from "./delays.ts";
import { checkQuota } from "./quotas.ts";
import {
  type SafetyConfig,
  type ActionType,
  DEFAULT_SAFETY_CONFIG,
  DESTRUCTIVE_ACTIONS,
} from "./types.ts";

export function loadSafetyConfig(): SafetyConfig {
  const cfg = loadConfig();
  return { ...DEFAULT_SAFETY_CONFIG, ...(cfg.safety ?? {}) } as SafetyConfig;
}

export function saveSafetyConfig(cfg: SafetyConfig): void {
  const current = loadConfig();
  current.safety = cfg;
  saveConfig(current);
}

function ensureSchema(): void {
  const d = db();
  d.run(`
    CREATE TABLE IF NOT EXISTS safety_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      dry_run INTEGER NOT NULL DEFAULT 1,
      blocked INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  d.run(`CREATE INDEX IF NOT EXISTS idx_safety_audit_action_created ON safety_audit(action, created_at)`);
}

function getQuotaLimit(action: ActionType): { limit: number; windowSeconds: number } | null {
  const cfg = loadSafetyConfig();
  if (!cfg.enabled || !cfg.quotas) return null;

  switch (action) {
    case "recruiter.add":
    case "outreach.log":
    case "outreach.withdraw":
      return { limit: cfg.quotas.invitesPerSession, windowSeconds: 86400 };
    case "job.save":
      return { limit: cfg.quotas.jobsPerDay, windowSeconds: 86400 };
    case "application.add":
    case "application.update":
      return { limit: cfg.quotas.applicationsPerDay, windowSeconds: 86400 };
    case "match":
      return { limit: cfg.quotas.searchesPerHour, windowSeconds: 3600 };
    default:
      return null;
  }
}

export interface SafetyResult {
  allowed: boolean;
  dryRun: boolean;
  reason?: string;
}

export async function check(action: ActionType): Promise<SafetyResult> {
  const cfg = loadSafetyConfig();
  const dryRun = cfg.dryRun;
  const isDestructive = DESTRUCTIVE_ACTIONS.includes(action);

  ensureSchema();

  if (!cfg.enabled) {
    return { allowed: true, dryRun: false };
  }

  const quota = getQuotaLimit(action);
  if (quota && !checkQuota(action, quota.limit, quota.windowSeconds)) {
    const result: SafetyResult = {
      allowed: false,
      dryRun,
      reason: `quota exceeded for ${action} (limit ${quota.limit})`,
    };
    if (isDestructive) {
      const d = db();
      d.query(`INSERT INTO safety_audit (action, dry_run, blocked, reason) VALUES ($action, $dryRun, 1, $reason)`).run({
        $action: action,
        $dryRun: dryRun ? 1 : 0,
        $reason: result.reason,
      });
    }
    return result;
  }

  if (isDestructive) {
    const d = db();
    d.query(`INSERT INTO safety_audit (action, dry_run, blocked) VALUES ($action, $dryRun, 0)`).run({
      $action: action,
      $dryRun: dryRun ? 1 : 0,
    });
  }

  return { allowed: true, dryRun };
}

export async function passed(action: ActionType): Promise<void> {
  const cfg = loadSafetyConfig();
  if (!cfg.enabled) return;

  if (DESTRUCTIVE_ACTIONS.includes(action)) {
    await jitter();
  }
}

export async function ok(action: ActionType): Promise<void> {
  const d = db();
  d.query(`INSERT INTO safety_audit (action, dry_run, blocked) VALUES ($action, 0, 0)`).run({
    $action: action,
  });
}
