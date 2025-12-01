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
  $inspect(_selected);

  let xScale = $derived(
    _data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null,
  );
  let yScale = $derived(
    _data ? scaleLinear().domain(_data.valueDomain).range([100, 0]) : null,
  );
</script>

{#snippet line(arr, width = 2, color = "grey")}
  <polyline
    points={arr
      .map((d) => [xScale(d.date), yScale(d[yKey])].join(","))
      .join(" ")}
    stroke={color}
    stroke-width={width}
  />
{/snippet}

<div
  class="sparkline-wrapper"
  style:padding-left="50px"
  style:padding-bottom="20px"
>
  <div class="sparkline-container">
    {#if xScale && yScale}
      <svg
        viewBox="0 0 100 100"
        class="sparkline-chart"
        preserveAspectRatio="none"
      >
        <g class="sparkline-lines">
          {#each _selected as arr, i}
            {@render line(arr, 2, ONSpalette[i])}
          {/each}
        </g>
      </svg>
      <div class="sparkline-x-axis">
        {#each _data.dateDomain as xTick}
          <div class="sparkline-x-tick" style:left="{xScale(xTick)}%"></div>
          <div class="sparkline-x-tick-label" style:left="{xScale(xTick)}%">
            {formatPeriod(xTick.toISOString())}
          </div>
        {/each}
      </div>
      <div class="sparkline-y-axis">
        {#each _data.valueDomain as yTick}
          <div class="sparkline-y-tick" style:top="{yScale(yTick)}%"></div>
          <div class="sparkline-y-tick-label" style:top="{yScale(yTick)}%">
            {formatValue(yTick)}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .sparkline-wrapper {
    display: block;
    position: relative;
  }
  .sparkline-container {
    display: block;
    position: relative;
    border-left: 1px solid grey;
  }
  .sparkline-x-axis,
  .sparkline-y-axis {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  .sparkline-x-tick {
    position: absolute;
    top: 100%;
    height: 10px;
    border-left: 1px solid grey;
  }
  .sparkline-x-tick-label {
    position: absolute;
    top: calc(100% + 10px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
  }
  .sparkline-y-tick {
    position: absolute;
    right: 100%;
    width: 10px;
    border-top: 1px solid grey;
  }
  .sparkline-y-tick-label {
    position: absolute;
    right: calc(100% + 10px);
    transform: translateY(-50%);
    font-size: 14px;
    white-space: nowrap;
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
