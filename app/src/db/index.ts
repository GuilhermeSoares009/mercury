import { Database } from "bun:sqlite";
import { ensureHome, paths } from "../paths.ts";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema.ts";

let _db: Database | null = null;

/**
 * Open (and memoize) the Mercury database, applying schema idempotently.
 * WAL mode so the dashboard can read while the CLI writes.
 */
export function db(): Database {
  if (_db) return _db;
  ensureHome();
  const d = new Database(paths.db, { create: true });
  d.exec("PRAGMA journal_mode = WAL;");
  d.exec("PRAGMA foreign_keys = ON;");
  d.exec(SCHEMA_SQL);
  d.query("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)").run(
    String(SCHEMA_VERSION),
  );
  _db = d;
  return d;
}

/** ISO timestamp helper used across write commands. */
export function now(): string {
  return new Date().toISOString();
}
