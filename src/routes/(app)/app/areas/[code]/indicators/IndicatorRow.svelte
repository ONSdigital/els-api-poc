<script lang="ts">
  import { Observe } from "@onsvisual/svelte-components";
  import { makeDataUrl, parseData } from "$lib/utils.ts";
  import Beeswarm from "$lib/viz/BeeswarmNew.svelte";
  import Sparkline from "$lib/viz/Sparkline.svelte";

  let {
    indicator,
    timeRange,
    selected = [],
    geoLevel,
    geoRelated,
    hovered = $bindable(),
  } = $props();

  let visible = $state();

  let loadedBeeswarmUrl = $state();
  let beeswarmData = $state();

  let loadedSparklineUrl = $state();
  let sparklineData = $state();

  async function fetchData(indicator, timeRange, selected, geoLevel, geoRelated, visible) {
    if (!visible) return;
    const beeswarmUrl = makeDataUrl(indicator, timeRange[1], "latest", selected, geoLevel, geoRelated);
    if (beeswarmUrl !== loadedBeeswarmUrl) {
      try {
        beeswarmData = await (await fetch(beeswarmUrl)).json();
      } catch {
        console.log("Failed to load beeswarm data");
      }
      loadedBeeswarmUrl = beeswarmUrl;
    }
    const sparklineUrl = makeDataUrl(indicator, timeRange, null, selected);
    if (sparklineUrl !== loadedSparklineUrl) {
      try {
        sparklineData = await (await fetch(sparklineUrl)).json();
      } catch {
        console.log("Failed to load sparkline data");
      }
      loadedSparklineUrl = sparklineUrl;
    }
  }
  $effect(async () => {
    console.log(`Refreshing ${indicator} data`);
    fetchData(indicator, timeRange, selected, geoLevel, geoRelated, visible);
  });
</script>

<Observe bind:visible>
  <div class="indicator-row">
    <div class="indicator-beeswarm">
      <Beeswarm data={beeswarmData || {message: "No data"}} {selected}/>
    </div>
    <div class="indicator-sparkline">
      <Sparkline data={sparklineData || {message: "No data"}} {selected}/>
    </div>
  </div>
</Observe>

<style>
  .indicator-row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    height: 120px;
  }
  .indicator-beeswarm {
    flex-grow: 1;
  }
  .indicator-sparkline {
    flex-shrink: 1;
    width: 170px;
  }
  .indicator-row :global(svg) {
    overflow: visible;
  }
</style>
