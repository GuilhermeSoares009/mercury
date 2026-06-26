<script>
  // Reusable Bits UI Select wrapper styled for Mercury's dark theme.
  // Single-select, bind:value, with a chevron trigger and a check on the
  // selected item. Replaces native <select> for consistent styling + keyboard
  // typeahead.
  import { Select } from "bits-ui";
  import { ChevronsUpDown, Check } from "@lucide/svelte";

  let {
    items = [],
    value = $bindable(),
    placeholder = "Select…",
    ariaLabel = "Select",
  } = $props();

  let selectedLabel = $derived(
    items.find((i) => i.value === value)?.label ?? placeholder
  );
</script>

<Select.Root type="single" {items} bind:value>
  <Select.Trigger
    class="flex items-center gap-2 w-full bg-panel-2 border border-border-2 rounded-lg px-[11px] py-2.5 text-text text-[0.9rem] cursor-pointer data-[state=open]:border-blue"
    aria-label={ariaLabel}
  >
    <span class="truncate text-start grow {value ? '' : 'text-dim'}">{selectedLabel}</span>
    <ChevronsUpDown size={15} class="text-dim shrink-0" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      class="z-50 max-h-72 w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] overflow-hidden rounded-lg border border-border-2 bg-panel shadow-lg"
      sideOffset={6}
    >
      <Select.Viewport class="p-1">
        {#each items as item (item.value)}
          <Select.Item
            class="flex items-center gap-2 rounded-md px-2.5 py-2 text-[0.88rem] text-text cursor-pointer select-none data-[highlighted]:bg-panel-2 data-[disabled]:opacity-50"
            value={item.value}
            label={item.label}
            disabled={item.disabled}
          >
            {#snippet children({ selected })}
              <span class="grow">{item.label}</span>
              {#if selected}<Check size={15} class="text-cyan shrink-0" />{/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
