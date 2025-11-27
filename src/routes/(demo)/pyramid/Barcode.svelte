<script>
  import Chart from "./BarcodeChart.svelte";
  export let data;
  export let selectedArea;
  export let groupKey = "areacd";
  import { colours } from "$lib/config";

  let hoveredArea;
  const keyedData = keyData(data, groupKey);

  function doSelect(cd) {
    selectedArea = cd;
  }
  function doHover(cd) {
    hoveredArea = cd;
  }

  function keyData(data, groupKey) {
    const keyedData = {};

    for (const d of data) {
      if (!keyedData[d[groupKey]]) keyedData[d[groupKey]] = [];
      keyedData[d[groupKey]].push(d);
    }
    return keyedData;
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css?family=Open Sans"
    rel="stylesheet"
  />
</svelte:head>

<ul class="selected-labels">
  {#if selectedArea.length && !hoveredArea}
    {#each selectedArea as a, i}
      <li class="label" style="background:{colours[i]}; color:white; font-size:18px; font-weight:bold">
        {keyedData[a]?.[0]?.areanm}
      </li>
    {/each}
  {/if}

  {#if hoveredArea}
  <li class="label" style="background:#f39431; color:white; font-size:18px; font-weight:bold">
    {keyedData[hoveredArea]?.[0]?.areanm}
  </li>
{/if}
</ul>


<Chart
  {data}
  {keyedData}
  {selectedArea}
  {hoveredArea}
  select={doSelect}
  hover={doHover}
/>

<style>
  .selected-labels {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
	min-height: 40px;
  }
  .label {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin: 0.2rem;
  }
</style>
