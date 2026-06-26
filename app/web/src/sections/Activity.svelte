<script>
  import { api } from "../api.js";
  import { resource } from "../lib/resource.svelte.js";
  import { useLiveTable } from "../lib/live.svelte.js";
  import LoadingState from "../lib/LoadingState.svelte";
  import ErrorState from "../lib/ErrorState.svelte";
  import EmptyState from "../lib/EmptyState.svelte";

  const activity = resource(() => api("activity"), []);
  useLiveTable("activity_log", activity.reload);
</script>

<h1 class="page-title">Activity</h1>
<p class="page-sub">Recent skill runs and actions · live agent stream comes in Phase 3</p>

{#if activity.status === "loading"}
  <LoadingState />
{:else if activity.status === "error"}
  <ErrorState error={activity.error} onretry={activity.reload} />
{:else if activity.data.length === 0}
  <EmptyState message="No activity logged yet." />
{:else}
  <div class="panel">
    {#each activity.data as a}
      <div class="flex gap-3 py-2.5 border-b border-border">
        <span class="dim text-[0.78rem] min-w-[140px]">{new Date(a.ts).toLocaleString()}</span>
        {#if a.skill}<span class="pill replied">{a.skill}</span>{/if}
        <span class="muted text-[0.88rem]">{a.summary ?? a.kind}</span>
      </div>
    {/each}
  </div>
{/if}
