<script>
  import { api } from "../api.js";
  let { rev } = $props();
  let rows = $state([]);
  async function load() { try { rows = await api("applications"); } catch {} }
  $effect(() => { rev; load(); });
</script>

<h1 class="page-title">Applications</h1>
<p class="page-sub">{rows.length} tailored resumes & cover letters</p>

{#if rows.length === 0}
  <div class="empty">No applications yet. Run the <code>resume-tailor</code> skill.</div>
{:else}
  <div class="panel">
    <table>
      <thead><tr><th>Role</th><th>Company</th><th>Keyword Score</th><th>Status</th><th>Files</th></tr></thead>
      <tbody>
        {#each rows as a}
          <tr>
            <td>{a.job_title ?? "—"}</td>
            <td>{a.company_name ?? "—"}</td>
            <td>{a.keyword_score != null ? `${a.keyword_score}%` : "—"}</td>
            <td class="dim">{a.status}</td>
            <td class="dim" style="font-size:.78rem">
              {#if a.resume_path}resume {/if}{#if a.cover_letter_path}· cover {/if}{#if a.report_path}· report{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
