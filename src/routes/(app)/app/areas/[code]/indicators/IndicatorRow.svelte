<script lang="ts">
  import { Observe } from "@onsvisual/svelte-components";
  import { makeDataUrl } from "$lib/utils.ts";
  import Beeswarm from "$lib/viz/BeeswarmNew.svelte";
  import Sparkline from "$lib/viz/Sparkline.svelte";

  let {
    indicator,
    timeRange,
    selected = [],
    geoGroup,
    hovered = $bindable(),
  } = $props();

  let visible = $state();

  let loadedBeeswarmUrl = $state();
  let beeswarmData = $state();

  let loadedSparklineUrl = $state();
  let sparklineData = $state();

  async function fetchData(indicator, timeRange, selected, geoLevel, geoExtent, geoCluster, visible) {
    if (!visible) return;
    const beeswarmUrl = makeDataUrl(indicator, timeRange[1], "latest", selected, geoLevel, geoExtent, geoCluster);
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
    fetchData(indicator, timeRange, selected, geoGroup.geoLevel, geoGroup.geoExtent, geoGroup.geoCluster, visible);
  });
</script>

<Observe bind:visible>
  <div class="indicator-row">
    <div class="indicator-beeswarm">
      <Beeswarm data={beeswarmData || {message: "No data"}} {selected} {visible} bind:hovered/>
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
    width: 100%;
    height: 120px;
  }
  .indicator-beeswarm {
    flex-grow: 1;
    max-width: 470px;
  }
  .indicator-sparkline {
    flex-shrink: 1;
    width: 170px;
  }
  .indicator-row :global(svg) {
    overflow: visible;
  }
</style>
