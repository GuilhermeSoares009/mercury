<script>
  import { api } from "../api.js";
  import uPlot from "uplot";
  import "uplot/dist/uPlot.min.css";

  let { rev } = $props();
  let metrics = $state([]);
  let chartEl = $state();
  let plot;

  async function load() {
    try { metrics = await api("metrics"); } catch {}
  }
  $effect(() => { rev; load(); });

  $effect(() => {
    if (!chartEl || metrics.length === 0) return;
    const xs = metrics.map((m) => Date.parse(m.captured_at) / 1000);
    const series = (key) => metrics.map((m) => m[key] ?? null);
    const data = [xs, series("profile_views"), series("search_appearances"), series("connections")];
    plot?.destroy();
    plot = new uPlot(
      {
        width: chartEl.clientWidth || 700,
        height: 260,
        scales: { x: { time: true } },
        series: [
          {},
          { label: "Profile Views", stroke: "#6dd5ed", width: 2 },
          { label: "Search Appearances", stroke: "#0077b5", width: 2 },
          { label: "Connections", stroke: "#a855f7", width: 2 },
        ],
        axes: [
          { stroke: "#71717a", grid: { stroke: "#1f1f26" } },
          { stroke: "#71717a", grid: { stroke: "#1f1f26" } },
        ],
      },
      data,
      chartEl
    );
  });

  let latest = $derived(metrics.at(-1));
</script>

<h1 class="page-title">Profile</h1>
<p class="page-sub">Recruiter-search visibility over time</p>

{#if metrics.length === 0}
  <div class="empty">No profile metrics captured yet. Run <code>profile-optimizer</code> to record your first snapshot.</div>
{:else}
  <div class="cards">
    <div class="card"><div class="label">Score</div><div class="value grad">{latest?.score ?? "—"}</div></div>
    <div class="card"><div class="label">Views</div><div class="value">{latest?.profile_views ?? "—"}</div></div>
    <div class="card"><div class="label">Search Appears/wk</div><div class="value">{latest?.search_appearances ?? "—"}</div></div>
    <div class="card"><div class="label">Connections</div><div class="value">{latest?.connections ?? "—"}</div></div>
  </div>

  <div class="panel">
    <h3>Trend</h3>
    {#if metrics.length === 1}
      <p class="dim" style="font-size:.85rem;margin-bottom:12px">Only one snapshot so far — the trend line fills in as you run more profile syncs.</p>
    {/if}
    <div bind:this={chartEl}></div>
  </div>
{/if}
