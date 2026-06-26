<script>
  import { api } from "../api.js";
  let { rev } = $props();
  let rows = $state([]);
  async function load() { try { rows = await api("jobs"); } catch {} }
  $effect(() => { rev; load(); });
</script>

<h1 class="page-title">Jobs</h1>
<p class="page-sub">{rows.length} scouted roles · search coming in Phase 2</p>

{#if rows.length === 0}
  <div class="empty">No jobs saved yet. Run the <code>job-scout</code> skill.</div>
{:else}
  <div class="panel">
    <table>
      <thead><tr><th>Role</th><th>Company</th><th>Mode</th><th>Fit</th><th>Status</th><th>Link</th></tr></thead>
      <tbody>
        {#each rows as j}
          <tr>
            <td>{j.title ?? "—"}</td>
            <td>{j.company_name ?? "—"}</td>
            <td class="dim">{j.work_type ?? "—"}</td>
            <td>{#if j.fit}<span class="pill {j.fit}">{j.fit}</span>{:else}—{/if}</td>
            <td class="dim">{j.status}</td>
            <td>{#if j.link}<a href={j.link} target="_blank">view</a>{:else}—{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
