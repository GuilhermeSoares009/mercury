<script>
  import { api } from "../api.js";
  import { resource } from "../lib/resource.svelte.js";
  import { useLiveTable } from "../lib/live.svelte.js";
  import LoadingState from "../lib/LoadingState.svelte";
  import ErrorState from "../lib/ErrorState.svelte";
  import EmptyState from "../lib/EmptyState.svelte";

  const apps = resource(() => api("applications"), []);
  useLiveTable("applications", apps.reload);
</script>

<h1 class="page-title">Applications</h1>
<p class="page-sub">
  {apps.status === "ready" ? apps.data.length : "—"} tailored resumes &amp; cover letters
</p>

{#if apps.status === "loading"}
  <LoadingState />
{:else if apps.status === "error"}
  <ErrorState error={apps.error} onretry={apps.reload} />
{:else if apps.data.length === 0}
  <EmptyState message="No applications yet." skill="resume-tailor" />
{:else}
  <div class="panel">
    <table>
      <thead><tr><th>Role</th><th>Company</th><th>Keyword Score</th><th>Status</th><th>Files</th></tr></thead>
      <tbody>
        {#each apps.data as a}
          <tr>
            <td>{a.job_title ?? "—"}</td>
            <td>{a.company_name ?? "—"}</td>
            <td>{a.keyword_score != null ? `${a.keyword_score}%` : "—"}</td>
            <td class="dim">{a.status}</td>
            <td class="dim text-[0.78rem]">
              {#if a.resume_path}resume {/if}{#if a.cover_letter_path}· cover {/if}{#if a.report_path}· report{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
