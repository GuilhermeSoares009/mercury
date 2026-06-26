import { db } from "../db/index.ts";

/** Read-side queries that power the dashboard REST API. */
export const queries = {
  overview() {
    const d = db();
    const score = d
      .query(
        "SELECT score FROM profile_metrics WHERE score IS NOT NULL ORDER BY captured_at DESC LIMIT 1",
      )
      .get() as { score: number } | null;
    const counts = d
      .query(`
        SELECT
          (SELECT COUNT(*) FROM recruiters) AS recruiters,
          (SELECT COUNT(*) FROM recruiters WHERE status = 'accepted') AS accepted,
          (SELECT COUNT(*) FROM recruiters WHERE status = 'replied') AS replied,
          (SELECT COUNT(*) FROM interviews WHERE status != 'closed') AS interviews,
          (SELECT COUNT(*) FROM jobs) AS jobs,
          (SELECT COUNT(*) FROM applications) AS applications
      `)
      .get();
    return { score: score?.score ?? null, ...(counts as object) };
  },

  recruiters() {
    return db()
      .query(`
        SELECT id, name, username, company, title, location, degree, status,
               date_contacted, accepted_at, replied_at, note, source_skill
        FROM recruiters
        ORDER BY
          CASE status WHEN 'interviewing' THEN 0 WHEN 'replied' THEN 1
                      WHEN 'accepted' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END,
          datetime(date_contacted) DESC
      `)
      .all();
  },

  jobs() {
    return db()
      .query(`
        SELECT id, linkedin_job_id, title, company_name, location, work_type,
               comp, fit, status, link, scouted_at
        FROM jobs ORDER BY scouted_at DESC
      `)
      .all();
  },

  metrics() {
    return db()
      .query(`
        SELECT captured_at, search_appearances, profile_views,
               post_impressions, connections, score
        FROM profile_metrics ORDER BY captured_at ASC
      `)
      .all();
  },

  interviews() {
    return db()
      .query(`
        SELECT id, company, scheduled_at, stage, status, notes
        FROM interviews ORDER BY datetime(scheduled_at) ASC
      `)
      .all();
  },

  applications() {
    return db()
      .query(`
        SELECT a.id, a.job_id, j.title AS job_title, j.company_name,
               a.resume_path, a.cover_letter_path, a.report_path,
               a.keyword_score, a.status, a.applied_at
        FROM applications a LEFT JOIN jobs j ON j.id = a.job_id
        ORDER BY a.id DESC
      `)
      .all();
  },

  activity(limit = 50) {
    return db()
      .query(`
        SELECT id, ts, kind, skill, summary FROM activity_log
        ORDER BY datetime(ts) DESC LIMIT ?
      `)
      .all(limit);
  },

  profile() {
    return db().query("SELECT * FROM profile WHERE id = 1").get() ?? null;
  },
};
