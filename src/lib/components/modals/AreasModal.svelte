<script lang="ts">
  import { Button, Dropdown, Select } from "@onsvisual/svelte-components";
  import Modal from "./Modal.svelte";
  import { ONSpalette } from "$lib/config";

  let { data, state = $bindable(), mode } = $props();

  function addArea(area) {
    if (!state.selectedAreas.find((d) => d.areacd === area.areacd))
      state.selectedAreas.push(area);
  }

  function removeArea(area) {
    state.selectedAreas = state.selectedAreas.filter(
      (d) => d.areacd !== area.areacd,
    );
  }
</script>

<Modal title="Select areas" label="Change areas" icon="pin">
  {#if mode === "indicator"}
    <Dropdown
      id="geo-level-select"
      label="Geography type"
      options={data.geoLevels}
      bind:value={state.selectedGeoLevel}
    />
  {/if}
  {#if mode === "area"}
    <Dropdown
      id="geo-related-select"
      label="Geography group"
      options={data.geoGroups}
      bind:value={state.selectedGeoGroup}
    />
  {/if}
  <div class="select-container">
    <Select
      id="area-select"
      label={mode === "area" ? "Comparison areas" : "Individual areas"}
      placeholder="Choose one or more"
      options={data.areas}
      labelKey="areanm"
      on:change={(e) => addArea(e.detail)}
      autoClear
    />
  </div>
  {#each state.selectedAreas as area, i}
    <Button
      icon="cross"
      color={(mode === "area" ? ONSpalette[i + 1] : ONSpalette[i]) ||
        "darkgrey"}
      small
      on:click={() => removeArea(area)}>{area.areanm}</Button
    >
  {/each}
</Modal>

<style>
  :global(.area-select__listbox) {
    /* z-index: 1 !important; */
  }
  :global(.modal-contents .ons-btn) {
    margin: 0.5em 0.5em 0 0;
  }
  .select-container {
    margin-top: 1em;
    width: 22.5rem;
    max-width: 100%;
  }
</style>
