<script lang="ts">
  import { scaleLinear, scaleTime } from "d3-scale";
  import { ticks, nice } from "d3-array";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
  import { markerPaths, ONSpalette } from "$lib/config";

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
    geoLevel,
  } = $props();

  const height = 300;
  let width = $state();
  const widthThreshold = 550;
  let rightMargin = $derived(width < widthThreshold ? 20 : 150);
  let widthInner = $derived(width - rightMargin - leftMargin);

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );

  let xScale = $derived(
    _data ? scaleTime().domain(_data.dateDomain).range([0, widthInner]) : null
  );

  let yDomain = $derived(_data ? nice(..._data.valueDomain, 2) : null);
  let yScale = $derived(
    _data ? scaleLinear().domain(yDomain).range([height, 0]) : null
  );

  let linesCount = $derived(Object.values(_data.keyed).length);
  let lineOpacity = $derived(
    linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2
  );
  let lineStroke = $derived(
    linesCount < 30 ? "2px" : linesCount < 100 ? "1.75px" : "1.5px"
  );

  let yTickWidth = $state({});

  let hovered = $derived(_data.keyed[hoveredArea]);
  let finalHoveredValue = $derived(
    hovered ? hovered[hovered.length - 1][yKey] : null
  );

  const formatYTick = format(",.0f");
  let leftMargin = $state(0);
  function updateLeftMargin(el) {
    const width = el.getBoundingClientRect().width;
    if (width > leftMargin) leftMargin = width;
  }

  const maxTickGap = 100; // in pixels
  let nXTicks = $derived(Math.floor(width / maxTickGap));

  let xTicks = $derived.by(() => {
    if (!xScale) return [];
    const initialTicks = xScale.ticks(nXTicks);
    const tickDiff =
      _data.dateDomain[1] - initialTicks[initialTicks.length - 1];
    // fix gap appearing on left hand side
    // STILL TO FIX - LEAP YEARS ISSUE
    const newTicks = initialTicks.map((d) => new Date(+d + tickDiff));
    const tickGap = newTicks[1] - newTicks[0];
    const firstGap = newTicks[0] - _data.dateDomain[0];
    if (firstGap > tickGap) newTicks.unshift(new Date(newTicks[0] - tickGap));
    return newTicks;
  });

  $inspect(_data);

  let maxValueLatestDate = $derived(
    Math.max(
      Object.values(_data.keyed)
        .flat()
        .filter((d) => d.date === _data.dateDomain[1])
        .map((m) => m.value)
    )
  );
  $inspect(_data.dateDomain[1], Object.values(_data.keyed).flat());
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

{#if width < widthThreshold}
  <ul class="selected-labels">
    {#if !hoveredArea}
      <li
        class="label"
        style="background:{'grey'}; color:white; font-size:18px; font-weight:bold"
      >
        {geoLevel.label}
      </li>
    {/if}

    {#if _selected.length && !hoveredArea}
      {#each _selected as a, i}
        <li
          class="label"
          style="background:{ONSpalette[
            i
          ]}; color:white; font-size:18px; font-weight:bold"
        >
          {a[0]?.areanm}
        </li>
      {/each}
    {/if}

    {#if hoveredArea}
      <li
        class="label"
        style="background:#f39431; color:white; font-size:18px; font-weight:bold"
      >
        {hovered?.[0]?.areanm}
      </li>
    {/if}
  </ul>
{/if}

<div
  bind:clientWidth={width}
  class="line-wrapper"
  style:padding-left="{leftMargin + 10}px"
  style:padding-top="0px"
  style:padding-bottom="25px"
  style:padding-right="{rightMargin}px"
>
  <div class="line-inner">
    <div class="line-x-axis">
      {#if yDomain?.[0] <= 0 && yDomain?.[1] >= 0}
        <div class="x-baseline" style:top="{yScale(0)}px"></div>
      {/if}
      {#each xTicks as xTick}
        <div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
        <div class="line-x-tick-label" style:left="{xScale(xTick)}px">
          {formatPeriod(xTick.toISOString())}
        </div>
      {/each}
    </div>
    <div class="line-y-axis">
      <div class="y-baseline"></div>
      {#each yScale.ticks(5) as yTick, i}
        <div class="line-y-tick" style:top="{yScale(yTick)}px"></div>
        <div
          class="line-y-tick-label"
          style:top="{yScale(yTick)}px"
          use:updateLeftMargin
        >
          {formatYTick(yTick)}
        </div>
      {/each}
    </div>
    <svg
      viewBox="0 0 {widthInner} {height}"
      class="line-chart"
      preserveAspectRatio="none"
    >
      {#if _data && xScale && yScale}
        <g opacity={hoveredArea ? 0.2 : 1}>
          {#each Object.values(_data.keyed) as arr, i}
            {@render line(
              arr,
              lineStroke,
              "#b0b0b0",
              lineOpacity,
              arr[0][idKey]
            )}
          {/each}

          {#each _selected as arr, i}
            {@render line(arr, 3, ONSpalette[i], 1, arr[0][idKey])}
            {#if width >= widthThreshold}
              <text
                class="margin-labels"
                x={xScale(_data.dateDomain[1]) + 10}
                y={yScale(arr[arr.length - 1][yKey])}
                fill={ONSpalette[i]}
                font-size="16"
                font-weight="bold"
                alignment-baseline="middle"
              >
                {arr[0]?.areanm}
              </text>

              <text
                class="margin-labels"
                x={xScale(_data.dateDomain[1]) + 10}
                y={yScale(maxValueLatestDate)}
                fill="grey"
                font-size="16"
                font-weight="bold"
                alignment-baseline="middle"
              >
                {geoLevel.label}
              </text>
            {/if}
          {/each}
          {#each _selected as s, sIndex}
            {#each s as c}
              <circle
                cx={xScale(c.date)}
                cy={yScale(c[yKey])}
                r="5"
                fill={ONSpalette[sIndex]}
                stroke="white"
              ></circle>
            {/each}
          {/each}
        </g>
        <g>
          {#if hoveredArea}
            {@render line(hovered, "4px", "orange", 1, hoveredArea)}
            {#if width >= widthThreshold}
              <text
                class="margin-labels"
                x={xScale(_data.dateDomain[1]) + 10}
                y={yScale(finalHoveredValue)}
                fill={"orange"}
                font-size="16"
                font-weight="bold"
                alignment-baseline="middle"
              >
                {hovered?.[0]?.areanm}
              </text>
            {/if}
            {#each hovered as c}
              <circle
                cx={xScale(c.date)}
                cy={yScale(c[yKey])}
                r="5"
                fill="orange"
                stroke="white"
              ></circle>
            {/each}
          {/if}
        </g>
      {/if}
    </svg>
  </div>
</div>

<style>
  .line-wrapper {
    display: block;
    position: relative;
  }
  .line-inner {
    display: block;
    position: relative;
  }
  .line-chart {
    width: 100%;
    margin-top: 30px;
    height: 300px;
    overflow: visible;
    display: block;
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

  .line-x-axis,
  .line-y-axis {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    pointer-events: none;
  }

  .line-x-tick {
    position: absolute;
    top: 100%;
    height: 10px;
    border-left: 1px solid grey;
  }

  .y-baseline {
    position: absolute;
    height: 100%;
    left: 0%;
    border-left: 1px solid grey;
  }

  .x-baseline {
    position: absolute;
    width: 100%;
    border-bottom: 2px solid grey;
    transform: translateY(-1px);
  }

  .line-y-tick {
    position: absolute;
    right: 100%;
    width: 8px;
    border-top: 1px solid grey;
  }

  .line-x-tick-label {
    position: absolute;
    top: calc(100% + 10px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
  }

  .line-y-tick-label {
    position: absolute;
    right: calc(100% + 10px);
    transform: translateY(-50%);
    font-size: 14px;
    white-space: nowrap;
  }
</style>
