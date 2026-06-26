<script>
  import LoadingState from "../lib/LoadingState.svelte";
  import ErrorState from "../lib/ErrorState.svelte";

  let { overview, onnav } = $props();

  function pillClass(value) {
    const v = String(value).toLowerCase();
    if (["true", "strong", "good", "ok", "yes", "done", "set"].some((s) => v.includes(s))) return "good";
    if (["weak", "missing", "empty", "none", "no", "false", "todo"].some((s) => v.includes(s))) return "bad";
    return "neutral";
  }
  let ov = $derived(overview.status === "ready" ? overview.data : null);
  let breakdown = $derived(ov?.breakdown ?? []);
</script>

<h1 class="page-title">Overview</h1>
<p class="page-sub">Your job search at a glance</p>

{#if overview.status === "loading"}
  <LoadingState rows={4} />
{:else if overview.status === "error"}
  <ErrorState error={overview.error} onretry={overview.reload} />
{:else}
  <div class="cards">
    <div class="card" role="button" tabindex="0" onclick={() => onnav("profile")}>
      <div class="label">Profile Score</div>
      <div class="value grad">{ov.score ?? "—"}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("recruiters")}>
      <div class="label">Recruiters</div>
      <div class="value">{ov.recruiters}</div>
    </div>
    <div class="card">
      <div class="label">Accepted</div>
      <div class="value text-green">{ov.accepted}</div>
    </div>
    <div class="card">
      <div class="label">Replied</div>
      <div class="value text-cyan">{ov.replied}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("interviews")}>
      <div class="label">Interviews</div>
      <div class="value text-purple">{ov.interviews}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("jobs")}>
      <div class="label">Jobs Saved</div>
      <div class="value">{ov.jobs}</div>
    </div>
  </div>

  {#if breakdown.length}
    <div class="panel">
      <h3>Profile breakdown
        <span class="dim text-[0.78rem] font-normal">· <a href={"#"} onclick={(e) => { e.preventDefault(); onnav("profile"); }}>view details →</a></span>
      </h3>
      <div class="bd-grid">
        {#each breakdown as item}
          <div class="bd-row">
            <span class="bd-label">{item.label}</span>
            {#if item.value}<span class="bd-pill {pillClass(item.value)}">{item.value}</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="panel">
    <h3>Pipeline health</h3>
    <p class="muted text-[0.9rem] leading-relaxed">
      {ov.recruiters} recruiters contacted · {ov.accepted} accepted ·
      {ov.replied} replied · {ov.interviews} interviews scheduled.
      {#if ov.score === null}
        <br />Go to <a href={"#"} onclick={(e) => { e.preventDefault(); onnav("profile"); }}>Profile</a> and click <strong>Scan profile</strong> to capture your first score + breakdown.
      {/if}
    </p>
  </div>
{/if}
