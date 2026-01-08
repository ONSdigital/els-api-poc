<script lang="ts">
  import { scaleLinear, scaleBand } from "d3-scale";
  import { ticks, groupSort } from "d3-array";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
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
    geoLevel,
  } = $props();

  let width = $state();
  const widthThreshold = 550;
  let leftMargin = $derived(width < widthThreshold ? 20 : 150);
  // let widthInner = $derived(width - rightMargin - leftMargin);
  let widthInner = $derived(width - 20 - 40);

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let sorted = $derived(
    _data ? [..._data.array].sort((a, b) => b[yKey] - a[yKey]) : []
  );

  const maxHeight = 500;
  const maxBarHeight = 30;
  const barGapRatio = 0.5; // Proportion of bar height
  const minSelectedBarHeight = 10; // Number of pixels
  const maxUnscaledBarsCount = Math.floor(
    500 / (maxBarHeight * (1 + barGapRatio))
  );

  let height = $derived(
    !_data || _data.array.length > maxUnscaledBarsCount
      ? maxHeight
      : _data.array.length * maxBarHeight +
          (_data.array.length + 1) * (maxBarHeight * barGapRatio)
  );

  function makeYScale(data, selected) {
    // Assumes "data" is pre-sorted from large to small
    const lookup = {};
    const count = data.length;
    const areaCodes = data.map((d) => d[idKey]);
    const selectedCount = selected.filter((cd) =>
      areaCodes.includes(cd)
    ).length;
    const unselectedCount = count - selectedCount;

    const rawBarHeight =
      count > maxUnscaledBarsCount
        ? maxHeight / (count + (count + 1) * barGapRatio)
        : maxBarHeight;
    const selectedBarsScaled =
      selectedCount > 0 && rawBarHeight < minSelectedBarHeight;
    const barHeight = selectedBarsScaled
      ? (maxHeight - selectedCount * minSelectedBarHeight) /
        (unselectedCount + (count + 1) * barGapRatio)
      : rawBarHeight;
    const barGap = barHeight * barGapRatio;

    let y = 0;
    for (const d of data) {
      y += barGap;
      const height =
        selectedBarsScaled && selected.includes(d[idKey])
          ? minSelectedBarHeight
          : barHeight;
      lookup[d[idKey]] = { y, height };
      y += height;
    }

    return (id) => lookup[id];
  }

  // function setBarHeight(id) {
  //   const defaultHeight = yScale.bandwidth();
  //   return selected.includes(id)
  //     ? defaultHeight * selectedBarScale
  //     : defaultHeight;
  // }

  function setBarColour(id) {
    const index = selected.indexOf(id);
    if (index === -1) {
      return "#b0b0b0";
    }

    return ONSpalette[index % ONSpalette.length];
  }

  let xScale = $derived(
    _data
      ? scaleLinear()
          .domain([Math.min(0, _data.valueDomain[0]), _data.valueDomain[1]])
          .range([0, widthInner])
      : null
  );

  // let yScale = $derived(
  //   _data
  //     ? scaleBand()
  //         .domain(sorted.map((d) => d[idKey]))
  //         .range([height, 0])
  //         .paddingInner(barGapScale)
  //     : null
  // );

  let yScale = $derived(sorted ? makeYScale(sorted, selected) : null);

  let hovered = $derived(_data.keyed[hoveredArea]?.[0]);

  // let barPositions = $derived(
  //   sorted
  //     ? (() => {
  //         let positions: number[] = [];
  //         let y = 0;
  //         for (const b of sorted) {
  //           positions.push(y);
  //           y += setBarHeight(b[idKey]) + barGap;
  //         }
  //         return positions;
  //       })()
  //     : []
  // );

  let hoveredIndex = $derived(
    hoveredArea ? sorted.findIndex((d) => d[idKey] === hoveredArea) : -1
  );

  $inspect(_data);
  $inspect(selected);
</script>

{#snippet bar(b, fill = "#b0b0b0", opacity = 1, id = "", i)}
  <rect
    class="chart-bars"
    x={0}
    y={yScale(b[idKey]).y}
    width={xScale(b[yKey])}
    height={yScale(b[idKey]).height}
    {fill}
    {opacity}
    on:pointerenter={() => {
      hoveredArea = id;
    }}
    on:pointerleave={() => {
      hoveredArea = null;
    }}
  />
{/snippet}

<div
  bind:clientWidth={width}
  class="bar-wrapper"
  style:padding-right="{30}px"
  style:padding-top="0px"
  style:padding-bottom="25px"
  style:padding-left="{leftMargin}px"
>
  <div class="bar-inner">
    <div class="line-y-axis">
      <div class="y-baseline"></div>
    </div>
    <div class="line-x-axis">
      <div class="x-baseline" style:top="{yScale(0)}px"></div>
      {#each xScale.ticks(5) as xTick}
        <div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
        <div class="line-x-tick-label" style:left="{xScale(xTick)}px">
          {formatValue(xTick)}
        </div>
      {/each}
    </div>
    <svg
      viewBox="0 0 {widthInner} {height}"
      class="bar-chart"
      preserveAspectRatio="none"
      style:height="{height}px"
    >
      {#if _data && xScale && yScale}
        <g opacity={hoveredArea ? 0.2 : 1}>
          {#each sorted as b, i}
            {@render bar(b, setBarColour(b[idKey]), 1, b[idKey], i)}
          {/each}
        </g>
        <g>
          {#if hoveredArea && hoveredIndex !== -1}
            {@render bar(hovered, "orange", 1, hoveredArea, hoveredIndex)}
          {/if}
        </g>
      {/if}
    </svg>
  </div>
</div>

<style>
  .bar-wrapper {
    display: block;
    position: relative;
  }
  .bar-inner {
    display: block;
    position: relative;
  }
  .bar-chart {
    width: 100%;
    margin-top: 30px;
    overflow: visible;
    display: block;
  }

  .y-baseline {
    position: absolute;
    height: 100%;
    left: 0%;
    border-left: 1px solid grey;
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
    width: 1px;
    top: calc(0%);
    height: 10px;
    border-left: 1px solid grey;
  }

  .line-x-tick-label {
    position: absolute;
    top: calc(0% - 25px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
  }

  .x-baseline {
    position: absolute;
    width: 100%;
    border-bottom: 2px solid grey;
    transform: translateY(-1px);
  }
</style>
