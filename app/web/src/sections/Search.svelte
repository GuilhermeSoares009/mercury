<script>
  import { TOKEN } from "../api.js";
  import { Tabs } from "bits-ui";
  import { Search as SearchIcon } from "@lucide/svelte";

  let mode = $state("jobs"); // jobs | people
  let keywords = $state("");
  let location = $state("");
  let company = $state("");
  let loading = $state(false);
  let error = $state(null);
  let raw = $state(null);

  async function run() {
    loading = true; error = null; raw = null;
    const path = mode === "jobs" ? "jobs" : "people";
    const body =
      mode === "jobs"
        ? { keywords, location }
        : { keywords, company, location };
    try {
      const res = await fetch(`/api/search/${path}?token=${encodeURIComponent(TOKEN)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      raw = json;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // The MCP returns a sections object with a free-text results blob; surface it.
  let resultText = $derived(
    raw?.sections?.search_results ?? raw?.raw ?? (raw ? JSON.stringify(raw, null, 2) : null)
  );
  let resultRefs = $derived(raw?.references?.search_results ?? []);
</script>

<h1 class="page-title">Search</h1>
<p class="page-sub">Instant LinkedIn search · "deep scout" hand-off to the agent comes in Phase 3</p>

<div class="panel">
  <Tabs.Root bind:value={mode}>
    <Tabs.List class="flex gap-2 mb-3.5">
      <Tabs.Trigger value="jobs"
        class="px-3.5 py-[7px] rounded-lg text-[0.85rem] cursor-pointer border border-border-2 bg-panel-2 text-muted
               data-[state=active]:bg-blue data-[state=active]:text-white data-[state=active]:border-blue">
        Jobs
      </Tabs.Trigger>
      <Tabs.Trigger value="people"
        class="px-3.5 py-[7px] rounded-lg text-[0.85rem] cursor-pointer border border-border-2 bg-panel-2 text-muted
               data-[state=active]:bg-blue data-[state=active]:text-white data-[state=active]:border-blue">
        Recruiters / People
      </Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>

  <div class="grid grid-cols-[1fr_1fr_1fr_auto] gap-2.5 items-end">
    <label class="field-label">Keywords<input class="input" bind:value={keywords} placeholder={mode === 'jobs' ? 'software engineer' : 'recruiter engineer Brazil'} /></label>
    {#if mode === 'people'}
      <label class="field-label">Company<input class="input" bind:value={company} placeholder="Airbnb" /></label>
    {/if}
    <label class="field-label">Location<input class="input" bind:value={location} placeholder="São Paulo" /></label>
    <button class="btn-primary" onclick={run} disabled={loading || !keywords}>
      <SearchIcon size={15} strokeWidth={2.2} />
      {loading ? "Searching…" : "Search"}
    </button>
  </div>
</div>

{#if error}
  <div class="panel border-red">
    <strong class="text-red">Search failed.</strong>
    <p class="muted text-[0.85rem] mt-1.5">{error}</p>
    <p class="dim text-[0.8rem] mt-1.5">
      Make sure the LinkedIn MCP is reachable and you're logged in to LinkedIn in your browser session.
    </p>
  </div>
{:else if raw}
  <div class="panel">
    <h3>Results</h3>
    {#if resultRefs.length}
      <div class="mb-3 flex flex-wrap gap-2">
        {#each resultRefs.filter((r) => r.kind === "person" || r.kind === "job") as ref}
          <a class="bg-panel-2 border border-border-2 rounded-[7px] px-2.5 py-1 text-[0.8rem]" href={`https://www.linkedin.com${ref.url}`} target="_blank">{ref.text ?? ref.url}</a>
        {/each}
      </div>
    {/if}
    <pre class="bg-panel-2 border border-border rounded-lg p-3.5 text-[0.82rem] leading-normal text-muted whitespace-pre-wrap max-h-[520px] overflow-auto font-mono">{resultText}</pre>
  </div>
{/if}
