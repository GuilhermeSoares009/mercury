<script>
  import { api } from "../api.js";
  let { rev } = $props();
  let rows = $state([]);
  async function load() { try { rows = await api("interviews"); } catch {} }
  $effect(() => { rev; load(); });

  function daysUntil(d) {
    if (!d) return null;
    const diff = Math.ceil((Date.parse(d) - Date.now()) / 86400000);
    return diff;
  }
</script>

<h1 class="page-title">Interviews</h1>
<p class="page-sub">{rows.length} scheduled</p>

{#if rows.length === 0}
  <div class="empty">No interviews scheduled yet.</div>
{:else}
  <div class="cards">
    {#each rows as iv}
      {@const d = daysUntil(iv.scheduled_at)}
      <div class="card">
        <div class="label">{iv.company}</div>
        <div class="value" style="font-size:1.3rem">{iv.scheduled_at ?? "TBD"}</div>
        <div class="dim" style="font-size:.82rem;margin-top:4px">
          {iv.stage ?? ""} · {iv.status}
          {#if d != null && d >= 0}<br /><span style="color:var(--amber)">in {d} day{d === 1 ? "" : "s"}</span>{/if}
        </div>
        {#if iv.notes}<div class="muted" style="font-size:.8rem;margin-top:8px">{iv.notes}</div>{/if}
      </div>
    {/each}
  </div>
{/if}
