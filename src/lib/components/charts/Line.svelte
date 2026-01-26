<script lang="ts">
  import { scaleLinear, scaleTime } from "d3-scale";
  import { nice } from "d3-array";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
  import { labelPlacer, marginLabels } from "./labelHelpers";
  import {
    markerPaths,
    ONSpalette,
    ONStextPalette,
    ONScolours,
  } from "$lib/config";
  import { pluralise } from "@onsvisual/robo-utils";
  import { tick } from "svelte";

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

  const height = 500;
  const widthThreshold = 550;
  const pointRadius = 5;
  const dodgedLabelGap = 16;

  let width = $state(680);
  let leftMargin = 30;
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
    yDomain ? scaleLinear().domain(yDomain).range([height, 0]) : null
  );

  let linesCount = $derived(_data ? Object.keys(_data.keyed).length : null);
  let lineOpacity = $derived(
    linesCount && linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2
  );
  let lineStroke = $derived(
    linesCount < 30 ? "2px" : linesCount < 100 ? "1.75px" : "1.5px"
  );

  let hovered = $derived(_data?.keyed?.[hoveredArea]);
  let finalHoveredValue = $derived(
    hovered ? hovered[hovered.length - 1][yKey] : null
  );

  const formatYTick = format(",.0f");
  // function updateLeftMargin(el) {
  //   const width = el.getBoundingClientRect().width;
  //   if (width > leftMargin) leftMargin = width;
  // }

  const maxTickGap = 100; // in pixels
  let nXTicks = $derived(Math.floor(width / maxTickGap));

  function makeXTicks(xScale, _data) {
    if (!xScale || !_data) return [];
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
  }
  let xTicks = $derived(makeXTicks(xScale, _data));

  let labelLookup = $state();
  async function makeLabelLookup(el, params) {
    labelLookup = await marginLabels(el, params);
  }
  const yScaleVar = (d) => yScale(d);

  let maxValueLatestDate = $derived(
    _data
      ? Math.max(
          ...Object.values(_data.keyed).map((d) => d[d.length - 1].value)
        )
      : 0
  );
</script>

{#snippet line(arr, width = 1, color = "#b0b0b0", opacity = 1, id = "")}
  <polyline
    points={arr
      .map((d) => [xScale(d.date), yScale(d[yKey])].join(","))
      .join(" ")}
    stroke={color}
    stroke-width={width}
    {opacity}
    onpointerenter={() => {
      hoveredArea = id;
    }}
    onpointerleave={() => {
      hoveredArea = null;
    }}
    style:pointer-events={color === "#b0b0b0" ? null : "none"}
  />
{/snippet}

{#if width < widthThreshold}
  <ul class="top-labels">
    {#if !hoveredArea}
      <li class="top-label-geo" style="background:{'grey'}">
        {pluralise(geoLevel.label)}
      </li>
    {/if}

    {#if _selected.length && !hoveredArea}
      {#each _selected as a, i}
        <li class="top-label-selected" style="background:{ONSpalette[i]}">
          {a[0]?.areanm}
        </li>
      {/each}
    {/if}

    {#if hoveredArea}
      <li class="top-label-hovered" style="background:#f39431">
        {hovered?.[0]?.areanm}
      </li>
    {/if}
  </ul>
{/if}

<div
  bind:clientWidth={width}
  class="line-wrapper"
  style:padding-left="{leftMargin + 10}px"
  style:padding-bottom="25px"
  style:padding-right="{rightMargin}px"
>
  <div class="line-inner">
    {#if _data && xScale && yScale}
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
          <div class="line-y-tick-label" style:top="{yScale(yTick)}px">
            {formatYTick(yTick)}
          </div>
        {/each}
      </div>
      <div class="margin-labels">
        {#if width >= widthThreshold && hoveredArea}
          <div
            class="margin-label-hovered"
            style="left: {xScale(_data.dateDomain[1]) + 10}px;top: {yScale(
              finalHoveredValue
            )}px;"
          >
            {hovered?.[0]?.areanm}
          </div>
        {/if}
        {#if width >= widthThreshold}
          <div
            class="margin-label-geo"
            style="left: {xScale(_data.dateDomain[1]) + 10}px;top: {yScale(
              maxValueLatestDate
            )}px;"
          >
            {pluralise(geoLevel.label)}
          </div>
        {/if}
        <div
          class="margin-labels-selected"
          use:makeLabelLookup={{ selected: _selected, yScaleVar, yKey }}
        >
          {#if width >= widthThreshold && !hoveredArea}
            {#each _selected as arr, i}
              {@const yPos =
                labelLookup?.[i]?.y ?? yScale(arr[arr.length - 1][yKey])}
              {@const isLabelDodged =
                labelLookup?.[i]?.y !== yScale(arr[arr.length - 1][yKey])}
              <div
                class="margin-label-selected"
                style="left: {isLabelDodged
                  ? xScale(_data.dateDomain[1]) + dodgedLabelGap
                  : xScale(_data.dateDomain[1]) +
                    dodgedLabelGap / 2}px;top: {yPos}px;color:{ONStextPalette[
                  i
                ]}"
              >
                {arr?.[0][labelKey]}
              </div>
            {/each}
          {/if}
        </div>
      </div>
      <svg
        viewBox="0 0 {widthInner} {height}"
        class="line-chart"
        preserveAspectRatio="none"
      >
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
          {/each}
          {#each _selected as s, sIndex}
            {#each s as c}
              <circle
                cx={xScale(c.date)}
                cy={yScale(c[yKey])}
                r={pointRadius}
                fill={ONSpalette[sIndex]}
                stroke="white"
              ></circle>
            {/each}
          {/each}
        </g>
        <g>
          {#if hoveredArea}
            {@render line(hovered, "4px", "orange", 1, hoveredArea)}
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
        {#if labelLookup?.[0] && !hovered}
          <g>
            {#each _selected as arr, i}
              {@const yPosAdj = labelLookup?.[i].y}
              {@const yPosOrig = yScale(arr[arr.length - 1][yKey])}
              {@const elbowX =
                xScale(_data.dateDomain[1]) +
                pointRadius +
                6 +
                labelLookup[i].elbow}
              <!-- {@const labelHeight = labelHeights?.[i]} -->
              {#if Math.abs(yPosAdj - yPosOrig) > 0.7}
                <polyline
                  stroke={ONScolours.grey60}
                  fill="none"
                  points="
                {xScale(_data.dateDomain[1]) + 2 + 14 + pointRadius},{yPosAdj}
                {elbowX},{yPosAdj}
                {elbowX},{yPosOrig} 
                {xScale(_data.dateDomain[1]) + 2 + pointRadius},{yPosOrig}"
                >
                </polyline>
              {:else if Math.abs(yPosAdj - yPosOrig) > 0}
                <polyline
                  stroke={ONScolours.grey60}
                  fill="none"
                  points="-14,{yPosAdj}
                -2,{yPosOrig}"
                >
                </polyline>
              {:else}{/if}
            {/each}
          </g>
        {/if}
      </svg>
    {/if}
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

  .top-labels {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
    min-height: 40px;
    color: white;
    font-size: 18px;
    font-weight: bold;
  }
  .top-label-selected,
  .top-label-geo,
  .top-label-hovered {
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

  .margin-labels {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .margin-label-hovered {
    position: absolute;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: bold;
    color: orange;
    max-width: 140px;
    line-height: 1.1;
  }

  .margin-label-selected {
    position: absolute;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: bold;
    max-width: 140px;
    line-height: 0.95;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .margin-label-geo {
    position: absolute;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: bold;
    color: grey;
    max-width: 140px;
    line-height: 1.1;
  }
</style>
