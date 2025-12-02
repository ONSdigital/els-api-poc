<script lang="ts">
  import { scaleLinear } from "d3-scale";
  import { nice } from "d3-array";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
  import { ONSpalette, markerPathsArray } from "$lib/config";

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

  const formatYTick = format("~s");

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : [],
  );
  $inspect(_selected);

  let xScale = $derived(
    _data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null,
  );
  let yDomain = $derived(_data ? nice(..._data.valueDomain, 2) : null);
  let yScale = $derived(
    yDomain ? scaleLinear().domain(yDomain).range([100, 0]) : null,
  );

  let yTickWidth = $state(Array(2).fill(40));
  let labelWidth = $state(Array(2).fill(40));
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

{#snippet marker(d, i)}
  <svg
    viewBox="-4 -4 8 8"
    class="sparkline-marker"
    style:top="{yScale(d[yKey])}%"
  >
    <path
      d={markerPathsArray[i]}
      fill={ONSpalette[i]}
      vector-effect="non-scaling-stroke"
    />
  </svg>
{/snippet}

{#snippet label(d, diff, i)}
  {@const color = ONSpalette[i]}
  <div
    class="sparkline-label"
    style:background={color}
    style:color={contrastColor(color)}
    style:top="{yScale(d[yKey])}%"
    bind:clientWidth={labelWidth[i]}
  >
    {`${diff > 0 ? "+" : ""}${formatValue(diff)}`}
  </div>
{/snippet}

<div
  class="sparkline-wrapper"
  style:padding-left="{(yTickWidth[1] ?? 40) + 10}px"
  style:padding-right="{(Math.max(...labelWidth) ?? 40) + 10}px"
  style:padding-top="10px"
  style:padding-bottom="25px"
>
  <div class="sparkline-container">
    {#if xScale && yScale && _selected[0].length > 1}
      <svg
        viewBox="0 0 100 100"
        class="sparkline-svg"
        preserveAspectRatio="none"
        style:height="90px"
      >
        <g class="sparkline-lines">
          {#each _selected as arr, i}
            {@render line(arr, 2, ONSpalette[i])}
          {/each}
        </g>
      </svg>
      <div class="sparkline-x-axis">
        {#each _data?.dateDomain as xTick}
          <div class="sparkline-x-tick" style:left="{xScale(xTick)}%"></div>
          <div class="sparkline-x-tick-label" style:left="{xScale(xTick)}%">
            {formatPeriod(xTick.toISOString())}
          </div>
        {/each}
      </div>
      <div class="sparkline-y-axis">
        <div class="sparkline-y-baseline"></div>
        {#each yDomain as yTick, i}
          <div class="sparkline-y-tick" style:top="{yScale(yTick)}%"></div>
          <div
            class="sparkline-y-tick-label"
            style:top="{yScale(yTick)}%"
            bind:clientWidth={yTickWidth[i]}
          >
            {formatYTick(yTick)}
          </div>
        {/each}
      </div>
      <div class="sparkline-annotations">
        {#each _selected as arr, i}
          {@const d = arr[arr.length - 1]}
          {@const diff = d[yKey] - arr[0][yKey]}
          {@render marker(d, i)}
          {#if i === 0}{@render label(d, diff, i)}{/if}
        {/each}
      </div>
    {:else}
      <p class="ons-u-fs-s">No time series data to display</p>
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
  }
  .sparkline-x-axis,
  .sparkline-y-axis,
  .sparkline-annotations {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  .sparkline-x-tick {
    position: absolute;
    top: 100%;
    height: 8px;
    border-left: 1px solid #b3b3b3;
  }
  .sparkline-x-tick-label {
    position: absolute;
    top: calc(100% + 4px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
  }
  .sparkline-y-baseline {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-left: 1px solid #b3b3b3;
  }
  .sparkline-y-tick {
    position: absolute;
    right: 100%;
    width: 8px;
    border-top: 1px solid #b3b3b3;
  }
  .sparkline-y-tick-label {
    position: absolute;
    right: calc(100% + 12px);
    transform: translateY(-50%);
    font-size: 14px;
    white-space: nowrap;
    text-transform: lowercase;
  }
  .sparkline-svg {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .sparkline-svg polyline {
    vector-effect: non-scaling-stroke;
    fill: none;
  }
  .sparkline-marker,
  .sparkline-label {
    position: absolute;
  }
  .sparkline-marker {
    width: 18px;
    height: 18px;
    left: 100%;
    transform: translate(-50%, -50%);
    stroke: white;
    stroke-width: 1px;
  }
  .sparkline-label {
    left: calc(100% + 10px);
    transform: translateY(-50%);
    padding: 4px 6px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1.2;
  }
</style>
