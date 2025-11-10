<script>
  import { page } from "$app/state";
  import { getContext } from "svelte";
  import { Button, Dropdown, Select } from "@onsvisual/svelte-components";
  import Modal from "./Modal.svelte";
  import { ONSpalette } from "$lib/config.js";

  let pageState = getContext("pageState");

  function addArea(area) {
    if (!pageState.selectedAreas.find(d => d.areacd === area.areacd)) pageState.selectedAreas.push(area);
  }

  function removeArea(area) {
    pageState.selectedAreas = pageState.selectedAreas.filter(d => d.areacd !== area.areacd);
  }
</script>

<Modal title="Select areas" label="Change areas">
  <Dropdown id="geo-level-select" label="Geography type" options={page.data.geoLevels} bind:value={pageState.selectedGeoLevel}/>
  <div class="select-container">
    <Select id="area-select" label="Individual areas" placeholder="Choose one or more" options={page.data.areas} labelKey="areanm" on:change={(e) => addArea(e.detail)} autoClear/>
  </div>
  {#each pageState.selectedAreas as area, i}
    <Button
      icon="cross"
      color={ONSpalette[i] || "darkgrey"}
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
    width: 22.5rem;
    max-width: 100%;
  }
</style>