import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Flags } from "../cli/flags.ts";
import { int, str } from "../cli/flags.ts";
import { ensureHome, paths } from "../paths.ts";
import { db } from "../db/index.ts";
import { queries } from "./queries.ts";

/** Directory holding the built Svelte assets (web/dist), resolved next to this file or the binary. */
function webDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "../../web/dist"), // running from source
    join(here, "web"), // embedded next to compiled binary
    join(process.cwd(), "web/dist"),
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0]!;
}

type WSData = { token: string };

export async function dashboardCmd(flags: Flags): Promise<void> {
  ensureHome();
  db(); // ensure schema

  const port = int(flags, "port") ?? 0; // 0 = OS-assigned
  const token = crypto.randomUUID();
  const noOpen = flags["no-open"] === true;
  const root = webDir();

  const sockets = new Set<import("bun").ServerWebSocket<WSData>>();

  const server = Bun.serve<WSData, {}>({
    port,
    hostname: "127.0.0.1",
    async fetch(req, srv) {
      const url = new URL(req.url);
      const path = url.pathname;

      // --- WebSocket upgrade for live updates ---
      if (path === "/ws") {
        if (url.searchParams.get("token") !== token) {
          return new Response("forbidden", { status: 403 });
        }
        if (srv.upgrade(req, { data: { token } })) return undefined as unknown as Response;
        return new Response("upgrade failed", { status: 400 });
      }

      // --- Internal change hook (called by the CLI after a write) ---
      if (path === "/_internal/changed" && req.method === "POST") {
        if (req.headers.get("x-mercury-token") !== token) {
          return new Response("forbidden", { status: 403 });
        }
        const body = (await req.json().catch(() => ({}))) as { table?: string };
        broadcast(sockets, { type: "changed", table: body.table ?? "unknown" });
        return Response.json({ ok: true });
      }

      // --- REST API (read-only in Phase 1) ---
      if (path.startsWith("/api/")) {
        if (url.searchParams.get("token") !== token) {
          return new Response("forbidden", { status: 403 });
        }
        return handleApi(path);
      }

      // --- Static assets (Svelte build) ---
      return serveStatic(root, path, token);
    },
    websocket: {
      open(ws) {
        sockets.add(ws);
        ws.send(JSON.stringify({ type: "hello" }));
      },
      close(ws) {
        sockets.delete(ws);
      },
      message() {
        /* client is read-only in Phase 1 */
      },
    },
  });

  // Write lockfile so the CLI can notify us of DB changes.
  writeFileSync(paths.serverLock, JSON.stringify({ port: server.port, token, pid: process.pid }));
  const cleanup = () => {
    try {
      if (existsSync(paths.serverLock)) unlinkSync(paths.serverLock);
    } catch {}
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  const dashUrl = `http://127.0.0.1:${server.port}/?token=${token}`;
  console.log(`\n  Mercury dashboard running at:\n  ${dashUrl}\n`);
  if (!noOpen) await openBrowser(dashUrl);
}

function broadcast(
  sockets: Set<import("bun").ServerWebSocket<WSData>>,
  msg: unknown,
): void {
  const data = JSON.stringify(msg);
  for (const ws of sockets) ws.send(data);
}

function handleApi(path: string): Response {
  switch (path) {
    case "/api/overview":
      return Response.json(queries.overview());
    case "/api/recruiters":
      return Response.json(queries.recruiters());
    case "/api/jobs":
      return Response.json(queries.jobs());
    case "/api/metrics":
      return Response.json(queries.metrics());
    case "/api/interviews":
      return Response.json(queries.interviews());
    case "/api/applications":
      return Response.json(queries.applications());
    case "/api/activity":
      return Response.json(queries.activity());
    case "/api/profile":
      return Response.json(queries.profile());
    default:
      return new Response("not found", { status: 404 });
  }
}

async function serveStatic(root: string, path: string, token: string): Promise<Response> {
  let rel = path === "/" ? "/index.html" : path;
  const file = Bun.file(join(root, rel));
  if (await file.exists()) return new Response(file);
  // SPA fallback
  const index = Bun.file(join(root, "index.html"));
  if (await index.exists()) return new Response(index);
  // No build yet — serve a helpful placeholder.
  return new Response(placeholderHtml(token), {
    headers: { "content-type": "text/html" },
  });
}

async function openBrowser(url: string): Promise<void> {
  const cmd =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  try {
    Bun.spawn(cmd, { stdout: "ignore", stderr: "ignore" });
  } catch {
    /* headless / no browser — URL already printed */
  }
}

function placeholderHtml(_token: string): string {
  return `<!doctype html><meta charset=utf8><title>Mercury</title>
<body style="font-family:system-ui;background:#0a0a0f;color:#e4e4e7;padding:40px">
<h1 style="background:linear-gradient(135deg,#0077b5,#6dd5ed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Mercury</h1>
<p>Server is running, but the web UI hasn't been built yet.</p>
<p>Run <code>cd app/web &amp;&amp; bun install &amp;&amp; bun run build</code>, then refresh.</p>
</body>`;
}
