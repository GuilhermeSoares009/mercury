<script>
  // Loading placeholder shown while a resource is fetching for the first time.
  // `rows` controls how many skeleton lines to render.
  let { rows = 3 } = $props();
  const widths = ["92%", "78%", "85%", "70%", "88%"];
</script>

<div class="panel flex flex-col gap-3">
  {#each Array(rows) as _, i}
    <div class="skeleton" style:width={widths[i % widths.length]}></div>
  {/each}
</div>
