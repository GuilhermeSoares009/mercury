<script>
  let { overview, rev, onnav } = $props();
</script>

<h1 class="page-title">Overview</h1>
<p class="page-sub">Your job search at a glance</p>

{#if overview}
  <div class="cards">
    <div class="card">
      <div class="label">Profile Score</div>
      <div class="value grad">{overview.score ?? "—"}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("recruiters")}>
      <div class="label">Recruiters</div>
      <div class="value">{overview.recruiters}</div>
    </div>
    <div class="card">
      <div class="label">Accepted</div>
      <div class="value" style="color:var(--green)">{overview.accepted}</div>
    </div>
    <div class="card">
      <div class="label">Replied</div>
      <div class="value" style="color:var(--cyan)">{overview.replied}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("interviews")}>
      <div class="label">Interviews</div>
      <div class="value" style="color:var(--purple)">{overview.interviews}</div>
    </div>
    <div class="card" role="button" tabindex="0" onclick={() => onnav("jobs")}>
      <div class="label">Jobs Saved</div>
      <div class="value">{overview.jobs}</div>
    </div>
  </div>

  <div class="panel">
    <h3>Pipeline health</h3>
    <p class="muted" style="font-size:.9rem;line-height:1.6">
      {overview.recruiters} recruiters contacted · {overview.accepted} accepted ·
      {overview.replied} replied · {overview.interviews} interviews scheduled.
      {#if overview.score === null}
        <br />Run <code>profile-optimizer</code> to capture your first profile score.
      {/if}
    </p>
  </div>
{:else}
  <div class="empty">Loading…</div>
{/if}
