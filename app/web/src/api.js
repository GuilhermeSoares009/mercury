// Token comes from the URL (?token=...) that the CLI opens.
const params = new URLSearchParams(location.search);
export const TOKEN = params.get("token") ?? "";

export async function api(path) {
  const res = await fetch(`/api/${path}?token=${encodeURIComponent(TOKEN)}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

/**
 * Connect to the live-update WebSocket. Calls `onChange(table)` whenever the
 * CLI (or agent) writes to the DB, so views can re-fetch.
 */
export function liveUpdates(onChange) {
  let ws;
  let retry;
  const connect = () => {
    ws = new WebSocket(`ws://${location.host}/ws?token=${encodeURIComponent(TOKEN)}`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "changed") onChange(msg.table);
      } catch {}
    };
    ws.onclose = () => {
      clearTimeout(retry);
      retry = setTimeout(connect, 1500);
    };
  };
  connect();
  return () => {
    clearTimeout(retry);
    ws?.close();
  };
}
