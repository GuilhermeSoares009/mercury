import { db, now } from "../db/index.ts";
import { notifyChange } from "../db/notify.ts";
import { type Flags, str, int, reqStr } from "./flags.ts";

/** mercury job save */
export async function jobCmd(sub: string, flags: Flags): Promise<void> {
  const d = db();
  if (sub === "save") {
    const row = d.query(`
      INSERT INTO jobs (linkedin_job_id, title, company_name, location, work_type, comp, fit, requirements_json, status, link)
      VALUES ($jid, $title, $company, $location, $work, $comp, $fit, $reqs, $status, $link)
      ON CONFLICT(linkedin_job_id) DO UPDATE SET
        fit = COALESCE(excluded.fit, jobs.fit),
        status = COALESCE(excluded.status, jobs.status)
      RETURNING id
    `).get({
      $jid: str(flags, "linkedin-id") ?? null,
      $title: str(flags, "title") ?? null,
      $company: str(flags, "company") ?? null,
      $location: str(flags, "location") ?? null,
      $work: str(flags, "work-type") ?? null,
      $comp: str(flags, "comp") ?? null,
      $fit: str(flags, "fit") ?? null,
      $reqs: str(flags, "requirements") ?? null,
      $status: str(flags, "status") ?? "saved",
      $link: str(flags, "link") ?? null,
    }) as { id: number };
    await notifyChange("jobs");
    console.log(`job #${row.id} saved`);
    return;
  }
  console.error(`unknown job subcommand: ${sub}`);
  process.exit(1);
}

/** mercury metric record */
export async function metricCmd(flags: Flags): Promise<void> {
  const d = db();
  const row = d.query(`
    INSERT INTO profile_metrics (captured_at, search_appearances, profile_views, post_impressions, connections, score, breakdown_json)
    VALUES ($at, $sa, $pv, $pi, $conn, $score, $breakdown)
    RETURNING id
  `).get({
    $at: str(flags, "at") ?? now(),
    $sa: int(flags, "search-appearances") ?? null,
    $pv: int(flags, "profile-views") ?? null,
    $pi: int(flags, "post-impressions") ?? null,
    $conn: int(flags, "connections") ?? null,
    $score: int(flags, "score") ?? null,
    $breakdown: str(flags, "breakdown") ?? null,
  }) as { id: number };
  await notifyChange("profile_metrics");
  console.log(`metric snapshot #${row.id} recorded`);
}

/** mercury score record — convenience that records a score-only metric row */
export async function scoreCmd(flags: Flags): Promise<void> {
  const d = db();
  const value = int(flags, "value");
  if (value === undefined) {
    console.error("error: missing --value");
    process.exit(1);
  }
  d.query(`
    INSERT INTO profile_metrics (captured_at, score, breakdown_json)
    VALUES ($at, $score, $breakdown)
  `).run({
    $at: now(),
    $score: value,
    $breakdown: str(flags, "signals") ?? null,
  });
  await notifyChange("profile_metrics");
  console.log(`score ${value} recorded`);
}

/** mercury interview add */
export async function interviewCmd(sub: string, flags: Flags): Promise<void> {
  const d = db();
  if (sub === "add") {
    const company = reqStr(flags, "company");
    const row = d.query(`
      INSERT INTO interviews (company, scheduled_at, stage, status, notes)
      VALUES ($company, $when, $stage, $status, $notes)
      RETURNING id
    `).get({
      $company: company,
      $when: str(flags, "when") ?? null,
      $stage: str(flags, "stage") ?? null,
      $status: str(flags, "status") ?? "scheduled",
      $notes: str(flags, "note") ?? null,
    }) as { id: number };
    await notifyChange("interviews");
    console.log(`interview #${row.id} (${company}) added`);
    return;
  }
  console.error(`unknown interview subcommand: ${sub}`);
  process.exit(1);
}

/** mercury application add */
export async function applicationCmd(sub: string, flags: Flags): Promise<void> {
  const d = db();
  if (sub === "add") {
    const row = d.query(`
      INSERT INTO applications (job_id, resume_path, cover_letter_path, report_path, keyword_score, status, applied_at)
      VALUES ($job, $resume, $cover, $report, $score, $status, $applied)
      RETURNING id
    `).get({
      $job: int(flags, "job-id") ?? null,
      $resume: str(flags, "resume-path") ?? null,
      $cover: str(flags, "cover-path") ?? null,
      $report: str(flags, "report-path") ?? null,
      $score: int(flags, "keyword-score") ?? null,
      $status: str(flags, "status") ?? "draft",
      $applied: str(flags, "applied-at") ?? null,
    }) as { id: number };
    await notifyChange("applications");
    console.log(`application #${row.id} added`);
    return;
  }
  console.error(`unknown application subcommand: ${sub}`);
  process.exit(1);
}

/** mercury activity log */
export async function activityCmd(flags: Flags): Promise<void> {
  const d = db();
  d.query(`
    INSERT INTO activity_log (kind, skill, summary, payload_json)
    VALUES ($kind, $skill, $summary, $payload)
  `).run({
    $kind: str(flags, "kind") ?? "skill-run",
    $skill: str(flags, "skill") ?? null,
    $summary: str(flags, "summary") ?? null,
    $payload: str(flags, "payload") ?? null,
  });
  await notifyChange("activity_log");
  console.log("activity logged");
}
