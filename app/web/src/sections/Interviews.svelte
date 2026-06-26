<script>
  import { api } from "../api.js";
  import { resource } from "../lib/resource.svelte.js";
  import { useLiveTable } from "../lib/live.svelte.js";
  import LoadingState from "../lib/LoadingState.svelte";
  import ErrorState from "../lib/ErrorState.svelte";
  import EmptyState from "../lib/EmptyState.svelte";

  const interviews = resource(() => api("interviews"), []);
  useLiveTable("interviews", interviews.reload);

  function daysUntil(d) {
    if (!d) return null;
    return Math.ceil((Date.parse(d) - Date.now()) / 86400000);
  }
</script>

<h1 class="page-title">Interviews</h1>
<p class="page-sub">{interviews.status === "ready" ? interviews.data.length : "—"} scheduled</p>

{#if interviews.status === "loading"}
  <LoadingState />
{:else if interviews.status === "error"}
  <ErrorState error={interviews.error} onretry={interviews.reload} />
{:else if interviews.data.length === 0}
  <EmptyState message="No interviews scheduled yet." />
{:else}
  <div class="cards">
    {#each interviews.data as iv}
      {@const d = daysUntil(iv.scheduled_at)}
      <div class="card">
        <div class="label">{iv.company}</div>
        <div class="value text-[1.3rem]">{iv.scheduled_at ?? "TBD"}</div>
        <div class="dim text-[0.82rem] mt-1">
          {iv.stage ?? ""} · {iv.status}
          {#if d != null && d >= 0}<br /><span class="text-amber">in {d} day{d === 1 ? "" : "s"}</span>{/if}
        </div>
        {#if iv.notes}<div class="muted text-[0.8rem] mt-2">{iv.notes}</div>{/if}
      </div>
    {/each}
  </div>
{/if}
