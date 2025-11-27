<script>
  import { page } from "$app/state";
  import { getContext } from "svelte";
  import { Button, Dropdown, Select } from "@onsvisual/svelte-components";
  import Modal from "./Modal.svelte";
  import { ONSpalette } from "$lib/config";

  let pageState = getContext("pageState");
  let mode = $derived(page.params?.code?.match(/^[EKNSW]{1}\d{8}$/) ? "area" : "indicator");

  function addArea(area) {
    if (!pageState.selectedAreas.find(d => d.areacd === area.areacd)) pageState.selectedAreas.push(area);
  }

  function removeArea(area) {
    pageState.selectedAreas = pageState.selectedAreas.filter(d => d.areacd !== area.areacd);
  }
</script>

<Modal title="Select areas" label="Change areas" icon="pin">
  {#if mode === "indicator"}
    <Dropdown id="geo-level-select" label="Geography type" options={page.data.geoLevels} bind:value={pageState.selectedGeoLevel}/>
  {/if}
  {#if mode === "area"}
    <Dropdown id="geo-related-select" label="Geography group" options={page.data.geoGroups} bind:value={pageState.selectedGeoGroup}/>
  {/if}
  <div class="select-container">
    <Select id="area-select" label={mode === "area" ? "Comparison areas" : "Individual areas"} placeholder="Choose one or more" options={page.data.areas} labelKey="areanm" on:change={(e) => addArea(e.detail)} autoClear/>
  </div>
  {#each pageState.selectedAreas as area, i}
    <Button
      icon="cross"
      color={(mode === "area" ? ONSpalette[i + 1] : ONSpalette[i]) || "darkgrey"}
      small
      on:click={() => removeArea(area)}>{area.areanm}</Button>
  {/each}
</Modal>

<style>
  :global(.area-select__listbox) {
    /* z-index: 1 !important; */
  }
  :global(.modal-contents .ons-btn) {
    margin: .5em .5em 0 0;
  }
  .select-container {
    margin-top: 1em;
    width: 22.5rem;
    max-width: 100%;
  }
</style>