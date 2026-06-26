import { db, now } from "../db/index.ts";
import { notifyChange } from "../db/notify.ts";
import { type Flags, str, int, reqStr } from "./flags.ts";

/** mercury recruiter add|update */
export async function recruiterCmd(sub: string, flags: Flags): Promise<void> {
  const d = db();
  if (sub === "add") {
    const name = reqStr(flags, "name");
    const stmt = d.query(`
      INSERT INTO recruiters (name, username, company, title, location, degree, mutuals_json, status, date_contacted, note, source_skill)
      VALUES ($name, $username, $company, $title, $location, $degree, $mutuals, $status, $date, $note, $skill)
      ON CONFLICT(username, company) DO UPDATE SET
        status = excluded.status,
        note = COALESCE(excluded.note, recruiters.note),
        updated_at = datetime('now')
      RETURNING id
    `);
    const row = stmt.get({
      $name: name,
      $username: str(flags, "username") ?? null,
      $company: str(flags, "company") ?? null,
      $title: str(flags, "title") ?? null,
      $location: str(flags, "location") ?? null,
      $degree: str(flags, "degree") ?? null,
      $mutuals: str(flags, "mutuals") ?? null,
      $status: str(flags, "status") ?? "pending",
      $date: str(flags, "date") ?? now(),
      $note: str(flags, "note") ?? null,
      $skill: str(flags, "source-skill") ?? "recruiter-outreach",
    }) as { id: number };
    await notifyChange("recruiters");
    console.log(`recruiter #${row.id} (${name}) saved`);
    return;
  }
  if (sub === "update") {
    const id = int(flags, "id");
    if (id === undefined) {
      console.error("error: missing --id");
      process.exit(1);
    }
    const status = str(flags, "status");
    const note = str(flags, "note");
    const sets: string[] = ["updated_at = datetime('now')"];
    const params: Record<string, string | number | null> = { $id: id };
    if (status) {
      sets.push("status = $status");
      params.$status = status;
      if (status === "accepted") sets.push("accepted_at = COALESCE(accepted_at, datetime('now'))");
      if (status === "replied") sets.push("replied_at = COALESCE(replied_at, datetime('now'))");
    }
    if (note !== undefined) {
      sets.push("note = $note");
      params.$note = note;
    }
    d.query(`UPDATE recruiters SET ${sets.join(", ")} WHERE id = $id`).run(params);
    await notifyChange("recruiters");
    console.log(`recruiter #${id} updated`);
    return;
  }
  console.error(`unknown recruiter subcommand: ${sub}`);
  process.exit(1);
}
