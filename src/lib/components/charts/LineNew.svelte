<script lang="ts">
  import { scaleLinear } from "d3-scale";
  import { parseChartData, markerPaths, contrastColor } from "./chartHelpers";
  import { ONSpalette } from "$lib/config";

  let {
    data,
    xKey = "period",
    yKey = "value",
    idKey = "areacd",
    labelKey = "areanm",
    formatValue = (d) => d,
    formatPeriod = (d) => d,
    selected = [],
  } = $props();

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : [],
  );

  $inspect(_data);

  let xScale = $derived(
    _data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null,
  );
  let yScale = $derived(
    _data ? scaleLinear().domain(_data.valueDomain).range([100, 0]) : null,
  );
</script>

{#snippet line(arr, width = 1, color = "grey")}
  <polyline
    points={arr
      .map((d) => [xScale(d.date), yScale(d[yKey])].join(","))
      .join(" ")}
    stroke={color}
    stroke-width={width}
  />
{/snippet}

<div class="line-wrapper">
  <svg viewBox="0 0 100 100" class="line-chart" preserveAspectRatio="none">
    {#if _data && xScale && yScale}
      <g>
        {#each Object.values(_data.keyed) as arr, i}
          {@render line(arr, 1, ONSpalette[i])}
        {/each}
      </g>
    {/if}
  </svg>
</div>

<style>
  .line-wrapper {
    display: block;
    position: relative;
  }
  .line-chart {
    width: 100%;
    height: 300px;
    margin-top: 30px;
    overflow: visible;
  }
  .line-chart polyline {
    vector-effect: non-scaling-stroke;
    fill: none;
  }
</style>
