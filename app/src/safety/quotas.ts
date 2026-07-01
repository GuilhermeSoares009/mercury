import { db } from "../db/index.ts";
import type { ActionType } from "./types.ts";

export interface Quota {
  windowStartsAt: string;
  count: number;
}

export function checkQuota(action: ActionType, limit: number, windowSeconds: number): boolean {
  const d = db();
  const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const row = d.query(`
    SELECT COUNT(*) as count
    FROM safety_audit
    WHERE action = $action AND created_at > $cutoff
  `).get({ $action: action, $cutoff: cutoff }) as { count: number };

  return row.count < limit;
}

export function getQuotaInfo(action: ActionType, windowSeconds: number): { used: number; limit: number; resetsIn: number } {
  const d = db();
  const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const row = d.query(`
    SELECT COUNT(*) as count
    FROM safety_audit
    WHERE action = $action AND created_at > $cutoff
  `).get({ $action: action, $cutoff: cutoff }) as { count: number };

  const windowEnd = new Date(Date.parse(cutoff) + windowSeconds * 1000);
  const resetsIn = Math.max(0, Math.ceil((windowEnd.getTime() - Date.now()) / 1000));

  return { used: row.count, limit: windowSeconds > 86400 ? 999 : 15, resetsIn };
}

export function resetSessionQuotas(): void {
  const d = db();
  d.query(`DELETE FROM safety_audit WHERE action IN ('recruiter.add', 'outreach.log', 'outreach.withdraw')`).run();
}
