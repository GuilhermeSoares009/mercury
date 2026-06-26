<script>
  import { api } from "../api.js";
  let { rev } = $props();
  let rows = $state([]);
  async function load() { try { rows = await api("activity"); } catch {} }
  $effect(() => { rev; load(); });
</script>

<h1 class="page-title">Activity</h1>
<p class="page-sub">Recent skill runs and actions · live agent stream comes in Phase 3</p>

{#if rows.length === 0}
  <div class="empty">No activity logged yet.</div>
{:else}
  <div class="panel">
    {#each rows as a}
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <span class="dim" style="font-size:.78rem;min-width:140px">{new Date(a.ts).toLocaleString()}</span>
        {#if a.skill}<span class="pill replied">{a.skill}</span>{/if}
        <span class="muted" style="font-size:.88rem">{a.summary ?? a.kind}</span>
      </div>
    {/each}
  </div>
{/if}
