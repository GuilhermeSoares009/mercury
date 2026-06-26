<script>
  // Error state with a Retry button. Used when a resource fetch throws — this is
  // distinct from the empty state, so a failed load no longer masquerades as
  // "run the skill".
  let { error = "Something went wrong.", onretry } = $props();
</script>

<div class="panel border-red">
  <strong class="text-red">Couldn't load this section.</strong>
  <p class="text-muted text-[0.85rem] mt-1.5 break-words">{error}</p>
  <p class="text-dim text-[0.8rem] mt-1.5">
    If this persists, make sure the LinkedIn MCP is reachable and you're logged in
    to LinkedIn in your browser session, then retry.
  </p>
  {#if onretry}
    <button
      class="mt-3 bg-transparent text-red border border-red px-4 py-[7px] rounded-lg cursor-pointer text-[0.85rem] font-semibold hover:bg-red/10"
      onclick={onretry}
    >Retry</button>
  {/if}
</div>
