<script>
  import ChipGroupItem from "./ChipGroupItem.svelte";

  let {
    name = "",
    label = null,
    items = null,
    idKey = "id",
    labelKey = "label",
    value = $bindable([]),
    visuallyHideLegend = false,
  } = $props();

  $inspect(value);
</script>

<fieldset class="button-group">
  {#if label}
    <legend class:ons-u-vh={visuallyHideLegend}>{label}</legend>
  {/if}
  <div class="buttons">
    {#if Array.isArray(items)}
      {#each items as item}
        <ChipGroupItem {item} {name} {idKey} {labelKey} bind:group={value}/>
      {/each}
    {/if}
  </div>
</fieldset>

<style>
  .button-group {
    display: flex;
  }

  legend {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    background: #f5f5f6;
    padding: 4px;
    border-radius: 8px;
    justify-content: flex-start;
  }
</style>
