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
    selected = []
  } = $props();

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );
  $inspect(_selected);

  let xScale = $derived(_data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null);
  let yScale = $derived(_data ? scaleLinear().domain(_data.valueDomain).range([100, 0]) : null);
</script>

{#snippet line(arr, width = 2, color = "grey")}
  <polyline
    points={arr.map(d => [xScale(d.date), yScale(d[yKey])].join(",")).join(" ")}
    stroke={color}
    stroke-width={width}/>
{/snippet}

<div class="sparkline-wrapper">
  <svg viewBox="0 0 100 100" class="sparkline-chart" preserveAspectRatio="none">
    {#if xScale && yScale}
      <g class="sparkline-lines">
        {#each _selected as arr, i}
          {@render line(arr, 2, ONSpalette[i])}
        {/each}
      </g>
    {/if}
  </svg>
  <!-- {#if _data}
    {#each _selected as d, i}
      {@render label(d, ONSpalette[i], false)}
    {/each}
  {/if} -->
</div>

<style>
  .sparkline-wrapper {
    display: block;
    position: relative;
  }
  .sparkline-chart {
    width: 100%;
    height: 70px;
    margin-top: 30px;
    overflow: visible;
  }
  .sparkline-chart polyline {
    vector-effect: non-scaling-stroke;
    fill: none;
  }
  .sparkline-label {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    padding: 4px 6px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1.2;
  }
</style>
