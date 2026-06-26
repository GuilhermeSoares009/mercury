<script>
  import { api, liveUpdates } from "./api.js";
  import Overview from "./sections/Overview.svelte";
  import Recruiters from "./sections/Recruiters.svelte";
  import Jobs from "./sections/Jobs.svelte";
  import Profile from "./sections/Profile.svelte";
  import Applications from "./sections/Applications.svelte";
  import Interviews from "./sections/Interviews.svelte";
  import Activity from "./sections/Activity.svelte";

  let active = $state("overview");
  let overview = $state(null);
  let connected = $state(false);

  // bump to force child re-fetch when the DB changes
  let rev = $state(0);

  const nav = [
    { id: "overview", label: "Overview", icon: "◎" },
    { id: "profile", label: "Profile", icon: "★" },
    { id: "recruiters", label: "Recruiters", icon: "✦" },
    { id: "jobs", label: "Jobs", icon: "❖" },
    { id: "applications", label: "Applications", icon: "✎" },
    { id: "interviews", label: "Interviews", icon: "▣" },
    { id: "activity", label: "Activity", icon: "≋" },
  ];

  async function loadOverview() {
    try { overview = await api("overview"); } catch {}
  }

  $effect(() => {
    loadOverview();
    const stop = liveUpdates(() => { rev++; loadOverview(); });
    connected = true;
    return stop;
  });
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand grad">Mercury</div>
    {#each nav as item}
      <div
        class="nav-item {active === item.id ? 'active' : ''}"
        onclick={() => (active = item.id)}
        role="button" tabindex="0"
      >
        <span>{item.icon}</span>
        <span>{item.label}</span>
        {#if item.id === "recruiters" && overview}<span class="badge">{overview.recruiters}</span>{/if}
        {#if item.id === "interviews" && overview}<span class="badge">{overview.interviews}</span>{/if}
        {#if item.id === "jobs" && overview}<span class="badge">{overview.jobs}</span>{/if}
      </div>
    {/each}
    <div style="position:absolute;bottom:18px;left:14px;font-size:.74rem;" class="dim">
      <span class="live-dot"></span> {connected ? "live" : "…"}
    </div>
  </aside>

  <main class="main">
    {#if active === "overview"}<Overview {overview} {rev} onnav={(id) => (active = id)} />
    {:else if active === "profile"}<Profile {rev} />
    {:else if active === "recruiters"}<Recruiters {rev} />
    {:else if active === "jobs"}<Jobs {rev} />
    {:else if active === "applications"}<Applications {rev} />
    {:else if active === "interviews"}<Interviews {rev} />
    {:else if active === "activity"}<Activity {rev} />
    {/if}
  </main>
</div>
