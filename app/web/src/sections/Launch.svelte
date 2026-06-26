<script>
  import { api, post, subscribe } from "../api.js";
  import { Rocket, X } from "@lucide/svelte";
  import Select from "../lib/Select.svelte";

  let providers = $state([]);
  let provider = $state("opencode");
  let model = $state("");
  let running = $state(false);
  let log = $state([]); // { kind, text }

  // skill param inputs
  let skill = $state("job-scout");
  let query = $state("");
  let location = $state("São Paulo");
  let company = $state("");
  let jobIds = $state("");

  $effect(() => {
    api("acp/providers").then((p) => {
      providers = p.providers;
      provider = p.default;
    }).catch(() => {});

    const unsub = subscribe((msg) => {
      switch (msg.type) {
        case "acp-status":
          if (msg.status === "starting") { running = true; push("status", `▶ starting ${msg.skill} via ${msg.provider}`); }
          else if (msg.status === "running") push("status", `● running ${msg.skill}`);
          else if (msg.status === "done") { running = false; push("status", `✓ ${msg.skill} finished`); }
          break;
        case "acp-update": {
          const u = msg.update?.update;
          const k = u?.sessionUpdate;
          if (k === "agent_message_chunk" && u.content?.text) push("msg", u.content.text, true);
          else if (k === "tool_call") push("tool", `🔧 ${u.title ?? u.kind ?? "tool"}`);
          else if (k === "tool_call_update" && u.status) push("tool", `   ${u.status}`);
          else if (k === "plan") push("plan", `📋 plan updated`);
          break;
        }
        case "acp-permission":
          push("perm", `🔐 auto-approved a permission request`);
          break;
        case "acp-log":
          break; // keep noise out of the stream
        case "acp-error":
          running = false; push("err", `✗ ${msg.message}`);
          break;
        case "acp-exit":
          running = false; break;
      }
    });
    return unsub;
  });

  // reset model when provider changes and current model isn't in new provider's list
  let prevProvider;
  $effect(() => {
    const prev = prevProvider;
    prevProvider = provider;
    if (prev === provider) return;
    const cur = providers.find((p) => p.id === provider);
    if (!cur || !cur.models || !cur.models.length) { model = ""; return; }
    if (model && !cur.models.includes(model)) model = "";
  });

  function push(kind, text, append = false) {
    if (append && log.length && log[log.length - 1].kind === "msg") {
      log[log.length - 1] = { kind, text: log[log.length - 1].text + text };
      log = [...log];
    } else {
      log = [...log, { kind, text }];
    }
  }

  async function launch() {
    log = [];
    const params = { query, location, company, jobIds };
    const selectedProvider = providers.find((p) => p.id === provider);
    const selectedModel = selectedProvider?.models?.includes(model) ? model : undefined;
    try {
      await post("acp/run", { provider, model: selectedModel, skill, params });
    } catch (e) {
      push("err", e.message);
    }
  }

  async function cancel() {
    try { await post("acp/cancel", {}); } catch {}
  }

  const skills = [
    { id: "job-scout", label: "Job Scout" },
    { id: "experience-bank", label: "Experience Bank (grill me)" },
    { id: "recruiter-outreach", label: "Recruiter Outreach" },
    { id: "profile-optimizer", label: "Profile Optimizer" },
    { id: "resume-tailor", label: "Resume Tailor" },
  ];

  // Bits UI Select item lists ({value,label}).
  let providerItems = $derived(providers.map((p) => ({ value: p.id, label: p.displayName })));
  let modelItems = $derived([
    { value: "", label: "Default" },
    ...(providers.find((p) => p.id === provider)?.models ?? []).map((m) => ({ value: m, label: m })),
  ]);
  const skillItems = skills.map((s) => ({ value: s.id, label: s.label }));
</script>

<h1 class="page-title">Launch</h1>
<p class="page-sub">Run a Mercury skill through your agent — live</p>

<div class="panel">
  <div class="grid grid-cols-3 gap-3">
    <label class="field-label">Agent
      <Select items={providerItems} bind:value={provider} placeholder="Agent" ariaLabel="Agent" />
    </label>
    <label class="field-label">Model
      <Select items={modelItems} bind:value={model} placeholder="Default" ariaLabel="Model" />
    </label>
    <label class="field-label">Skill
      <Select items={skillItems} bind:value={skill} placeholder="Skill" ariaLabel="Skill" />
    </label>
  </div>

  <div class="grid grid-cols-3 gap-3 mt-3">
    {#if skill === "job-scout"}
      <label class="field-label">Query<input class="input" bind:value={query} placeholder="backend engineer" /></label>
      <label class="field-label">Location<input class="input" bind:value={location} /></label>
    {:else if skill === "recruiter-outreach"}
      <label class="field-label">Company<input class="input" bind:value={company} placeholder="Airbnb" /></label>
      <label class="field-label">Location<input class="input" bind:value={location} /></label>
    {:else if skill === "resume-tailor"}
      <label class="field-label">Job IDs (comma-sep)<input class="input" bind:value={jobIds} placeholder="4393940374, 3969556398" /></label>
    {:else if skill === "profile-optimizer"}
      <span class="dim text-[0.85rem] self-center">No parameters — audits your profile.</span>
    {:else if skill === "experience-bank"}
      <span class="dim text-[0.85rem] self-center">No parameters — interviews you about new achievements (interactive).</span>
    {/if}
  </div>

  <div class="mt-3.5 flex gap-2.5">
    <button class="btn-primary" onclick={launch} disabled={running}>
      <Rocket size={15} strokeWidth={2.2} />
      {running ? "Running…" : "Launch"}
    </button>
    {#if running}<button class="btn-danger" onclick={cancel}><X size={15} strokeWidth={2.2} /> Cancel</button>{/if}
  </div>
</div>

<div class="panel">
  <h3>Agent stream {#if running}<span class="live-dot"></span>{/if}</h3>
  {#if log.length === 0}
    <div class="empty">No run yet. Pick a skill and hit Launch.</div>
  {:else}
    <div class="stream">
      {#each log as entry}
        <div class="stream-line {entry.kind}">{entry.text}</div>
      {/each}
    </div>
  {/if}
</div>
