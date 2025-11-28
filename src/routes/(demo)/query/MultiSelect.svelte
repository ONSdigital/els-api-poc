<script lang="ts">
  import { Select, Button } from "@onsvisual/svelte-components";

  let { id, label, items, idKey = "id", labelKey="label", selected = $bindable([]) } = $props();

  function addItem(item) {
    if (!selected.find(d => d[idKey] === item[idKey])) selected.push(item);
  }

  function removeItem(item) {
    selected = selected.filter(d => d[idKey] !== item[idKey]);
  }
</script>

<div class="multiselect-container">
  <div class="select-container">
    <Select {id} {label} placeholder="Choose one or more" options={items} {labelKey} on:change={(e) => addItem(e.detail)} autoClear/>
  </div>
  {#each selected as item, i}
    <Button
      icon="cross"
      variant="secondary"
      small
      on:click={() => removeItem(item)}>{item[labelKey]}</Button>
  {/each}
</div>

<style>
  :global(.area-select__listbox) {
    /* z-index: 1 !important; */
  }
  :global(.multiselect-container .ons-btn) {
    margin: .5em .5em 0 0;
  }
  .select-container {
    width: 22.5rem;
    max-width: 100%;
  }
</style>