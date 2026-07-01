import { db } from "../db/index.ts";
import { type Flags, str, int } from "./flags.ts";
import { loadSafetyConfig, saveSafetyConfig, type SafetyConfig } from "../safety/gate.ts";
import { resetSessionQuotas } from "../safety/quotas.ts";
import { resetDelayTimer } from "../safety/delays.ts";

export async function safetyCmd(sub: string, flags: Flags): Promise<void> {
  switch (sub) {
    case "status":
      statusCmd();
      break;
    case "reset":
      resetCmd();
      break;
    case "config":
      configCmd(flags);
      break;
    default:
      console.error(`usage: mercury safety status|reset|config`);
      process.exit(1);
  }
}

function statusCmd(): void {
  const cfg = loadSafetyConfig();
  const d = db();

  const today = new Date().toISOString().slice(0, 10);
  const sessionActions = d.query(`
    SELECT action, COUNT(*) as count
    FROM safety_audit
    WHERE created_at > datetime('now', '-24 hours')
    GROUP BY action
    ORDER BY count DESC
  `).all() as { action: string; count: number }[];

  console.log(`Safety gate: ${cfg.enabled ? "✅ ON" : "❌ OFF"}`);
  console.log(`Dry-run: ${cfg.dryRun ? "✅ ON (default)" : "❌ OFF (live)"}`);
  console.log(``);
  console.log(`Actions in last 24h:`);

  if (sessionActions.length === 0) {
    console.log(`  (none yet)`);
  } else {
    for (const row of sessionActions) {
      console.log(`  ${row.action}: ${row.count}`);
    }
  }

  console.log(``);
  console.log(`Delays: ${cfg.delays?.minSeconds ?? 180}s - ${cfg.delays?.maxSeconds ?? 900}s`);
}

function resetCmd(): void {
  resetSessionQuotas();
  resetDelayTimer();
  console.log(`Safety quotas and delay timer reset.`);
}

function configCmd(flags: Flags): void {
  const cfg = loadSafetyConfig();
  const enabled = str(flags, "enabled");
  const dryRun = str(flags, "dry-run");
  const invitesLimit = int(flags, "invites-limit");
  const jobsLimit = int(flags, "jobs-limit");
  const appsLimit = int(flags, "apps-limit");

  if (enabled === "true" || enabled === "false") {
    cfg.enabled = enabled === "true";
  }
  if (dryRun === "true" || dryRun === "false") {
    cfg.dryRun = dryRun === "true";
  }
  if (invitesLimit !== undefined) {
    if (!cfg.quotas) cfg.quotas = { invitesPerSession: 15, jobsPerDay: 50, applicationsPerDay: 10, searchesPerHour: 30 };
    cfg.quotas.invitesPerSession = invitesLimit;
  }
  if (jobsLimit !== undefined) {
    if (!cfg.quotas) cfg.quotas = { invitesPerSession: 15, jobsPerDay: 50, applicationsPerDay: 10, searchesPerHour: 30 };
    cfg.quotas.jobsPerDay = jobsLimit;
  }
  if (appsLimit !== undefined) {
    if (!cfg.quotas) cfg.quotas = { invitesPerSession: 15, jobsPerDay: 50, applicationsPerDay: 10, searchesPerHour: 30 };
    cfg.quotas.applicationsPerDay = appsLimit;
  }

  saveSafetyConfig(cfg);
  console.log(`Safety config updated.`);
  statusCmd();
}
