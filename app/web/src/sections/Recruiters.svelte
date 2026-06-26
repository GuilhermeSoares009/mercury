<script>
  import { api } from "../api.js";
  let { rev } = $props();
  let rows = $state([]);

  const COLS = ["pending", "accepted", "replied", "interviewing", "closed"];

  async function load() {
    try { rows = await api("recruiters"); } catch {}
  }
  $effect(() => { rev; load(); });

  let byStatus = $derived(
    COLS.reduce((acc, c) => { acc[c] = rows.filter((r) => r.status === c); return acc; }, {})
  );
</script>

<h1 class="page-title">Recruiters</h1>
<p class="page-sub">{rows.length} contacts across your outreach pipeline</p>

{#if rows.length === 0}
  <div class="empty">No recruiters yet. Run the <code>recruiter-outreach</code> skill.</div>
{:else}
  <div class="kanban">
    {#each COLS as col}
      <div class="kanban-col">
        <h4>{col} <span>{byStatus[col].length}</span></h4>
        {#each byStatus[col] as r}
          <div class="kanban-card">
            <div class="n">
              {#if r.username}<a href={`https://www.linkedin.com/in/${r.username}/`} target="_blank">{r.name}</a>{:else}{r.name}{/if}
            </div>
            <div class="c">{r.company ?? ""}{r.title ? ` · ${r.title}` : ""}</div>
            <div class="c">{r.location ?? ""}{r.degree ? ` · ${r.degree}` : ""}</div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/if}
