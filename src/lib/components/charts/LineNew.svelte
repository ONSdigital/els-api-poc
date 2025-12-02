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
    hoveredArea = null,
  } = $props();

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );

  let xScale = $derived(
    _data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null
  );
  let yScale = $derived(
    _data ? scaleLinear().domain(_data.valueDomain).range([100, 0]) : null
  );

  let linesCount = $derived(Object.values(_data.keyed).length);
  let lineOpacity = $derived(
    linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2
  );
  let lineStroke = $derived(
    linesCount < 30 ? "2px" : linesCount < 100 ? "1.75px" : "1.5px"
  );

  $inspect(_selected);
</script>

{#snippet line(arr, width = 1, color = "#b0b0b0", opacity = 1, id = "")}
  <polyline
    points={arr
      .map((d) => [xScale(d.date), yScale(d[yKey])].join(","))
      .join(" ")}
    stroke={color}
    stroke-width={width}
    {opacity}
    on:pointerenter={() => {
      hoveredArea = id;
    }}
    on:pointerleave={() => {
      hoveredArea = null;
    }}
  />
{/snippet}

<div class="line-wrapper">
  <svg viewBox="0 0 100 100" class="line-chart" preserveAspectRatio="none">
    <g class="y-axis-container">
      <line
        x1="0"
        x2="0"
        y1={yScale(_data.valueDomain[0])}
        y2={yScale(_data.valueDomain[1])}
        stroke={"black"}
        stroke-width={1}
      ></line>
    </g>
    <g class="x-axis-container">
      <line
        y1={yScale(_data.valueDomain[0])}
        y2={yScale(_data.valueDomain[0])}
        x1={xScale(_data.dateDomain[0])}
        x2={xScale(_data.dateDomain[1])}
        stroke={"black"}
        stroke-width={1}
      ></line>
    </g>
    {#if _data && xScale && yScale}
      <g>
        {#each Object.values(_data.keyed) as arr, i}
          {@render line(arr, lineStroke, "#b0b0b0", lineOpacity, arr[0][idKey])}
        {/each}

        {#if !hoveredArea}
          {#each _selected as arr, i}
            {@render line(arr, 3, ONSpalette[i], 1, arr[0][idKey])}
          {/each}
        {/if}

        {#if hoveredArea}
          {@render line(
            _data.keyed[hoveredArea],
            "4px",
            "orange",
            1,
            hoveredArea
          )}
          {#each _data.keyed[hoveredArea] as c}
            <circle
              cx={xScale(c.date)}
              cy={yScale(c[yKey])}
              r="1.25"
              fill="orange"
              stroke="white"
            ></circle>
          {/each}
        {/if}
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
    margin-top: 30px;
    height: 300px;
    overflow: visible;
  }
  .line-chart polyline,
  .line-chart line {
    vector-effect: non-scaling-stroke;
    fill: none;
  }

  .line-chart circle {
    vector-effect: non-scaling-stroke;
    vector-effect: non-scaling-size;
  }
</style>
