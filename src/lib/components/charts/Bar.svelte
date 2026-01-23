<script lang="ts">
  import { scaleLinear, scaleBand } from "d3-scale";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
  import { labelPlacer } from "./labelHelpers";
  import { ONSpalette, ONStextPalette, ONScolours } from "$lib/config";
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

  let width = $state();
  const widthThreshold = 550;
  let leftMargin = $derived(width < widthThreshold ? 20 : 150);
  const rightMargin = 30;
  let widthInner = $derived(width - rightMargin - leftMargin);

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let sorted = $derived(
    _data ? [..._data.array].sort((a, b) => b[yKey] - a[yKey]) : []
  );
  let hovered = $derived(_data.keyed[hoveredArea]?.[0]);
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
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

  function setBarColour(id) {
    const index = selected.indexOf(id);
    if (index === -1) {
      return "#b0b0b0";
    }

    return ONSpalette[index % ONSpalette.length];
  }

  let yScale = $derived(sorted ? makeYScale(sorted, selected) : null);
  let ys = _selected.map((s) => yScale(s[0][idKey]).y);
  let ysIndexes = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  let yLabelPositions = $state();
  async function marginLabels(el) {
    await tick();
    const divs = el.getElementsByTagName("div");
    if (divs.length < 2) {
      yLabelPositions = null;
      return;
    }
    let ys = _selected.map((s) => yScale(s[0][idKey]).y);
    let ysIndexes = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
    console.log({ ysIndexes });

    const cumulativeHeights = Array(_selected.length).fill(0);
    for (let j = 1; j < _selected.length; j++) {
      const current = ysIndexes[j].i;
      const previous = ysIndexes[j - 1].i;
      cumulativeHeights[current] =
        cumulativeHeights[previous] +
        (divs[previous].clientHeight + divs[current].clientHeight) / 2;
    }
    console.log({ cumulativeHeights });
    // subtract offsets
    let zs = ysIndexes.map(({ y, i }) => y - cumulativeHeights[i]);
    // run isotonic regression function to overwrite yLabelPositions
    let adj = labelPlacer(zs);
    // add offsets back on to the regressed values
    yLabelPositions = Array(_selected.length).fill(0);
    ysIndexes.forEach(({ i }, j) => {
      yLabelPositions[i] = adj[j] + cumulativeHeights[i];
    });
  }

  // Group together proximate selected labels (after dodging)
  // to allow for elbow offsetting

  let elbowOffset = $derived.by(() => {
    if (!_selected.length || !yLabelPositions) return [];

    const labelProximityThreshold = 2;
    const leaderLineGroups = [];

    ysIndexes.forEach((arr, i) => {
      const y = yLabelPositions[i];
      let group = leaderLineGroups.find(
        (g) => Math.abs(g.y - y) < labelProximityThreshold
      );
      if (!group) {
        group = { y, items: [] };
        leaderLineGroups.push(group);
      }
      group.items.push(i);
    });

    console.log({ leaderLineGroups });

    const elbowRoom = 6;

    const elbowOffsets = Array(_selected.length).fill(0);

    leaderLineGroups.forEach((group) => {
      const indices = group.items;

      const middleElbowOffset = indices.length > 2 ? elbowRoom : elbowRoom / 2;

      const elbowGap =
        indices.length > 2
          ? middleElbowOffset / Math.floor((indices.length - 1) / 2)
          : 0;

      indices.forEach((labelIndex, groupIndex) => {
        const offset =
          middleElbowOffset -
          Math.floor(Math.abs(groupIndex - (indices.length - 1) / 2)) *
            elbowGap;

        elbowOffsets[labelIndex] = offset;
      });
    });
    return elbowOffsets;
  });

  let xScale = $derived(
    _data
      ? scaleLinear()
          .domain([Math.min(0, _data.valueDomain[0]), _data.valueDomain[1]])
          .range([0, widthInner])
      : null
  );

  let hoveredIndex = $derived(
    hoveredArea ? sorted.findIndex((d) => d[idKey] === hoveredArea) : -1
  );

  $inspect({ yLabelPositions });
  $inspect({ elbowOffset });
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
    style:pointer-events={fill === "#b0b0b0" ? null : "none"}
  />
{/snippet}

{#snippet line(d, i, color)}
  {@const offsetX = labels?.[i]?.x ?? d.x}
  <polyline
    points="{d.x},{100 - d.y} {d.x},{(100 - d.y) / 3} {offsetX},{(100 - d.y) /
      3} {offsetX},0"
    stroke={color}
    stroke-width="2"
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
          {a?.[0]?.areanm}
        </li>
      {/each}
    {/if}

    {#if hoveredArea}
      <li class="top-label-hovered" style="background:#f39431">
        {hovered?.areanm}
      </li>
    {/if}
  </ul>
{/if}

<div
  bind:clientWidth={width}
  class="bar-wrapper"
  style:padding-right="{rightMargin}px"
  style:padding-top="36px"
  style:padding-bottom="25px"
  style:padding-left="{leftMargin}px"
>
  <div class="bar-inner">
    <div class="line-y-axis">
      <div class="y-baseline"></div>
    </div>
    <div class="line-x-axis">
      <div class="x-baseline" style:top="0"></div>
      {#each xScale.ticks(5) as xTick}
        <div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
        <div class="line-x-tick-label" style:left="{xScale(xTick)}px">
          {formatValue(xTick)}
        </div>
      {/each}
    </div>
    <div class="margin-labels">
      {#if width >= widthThreshold && hoveredArea}
        <div
          class="margin-label-hovered"
          style="top: {yScale(hovered[idKey]).y +
            yScale(hovered[idKey]).height / 2}px;"
        >
          {hovered?.[labelKey]}
        </div>
      {/if}
      {#if width >= widthThreshold}
        <div
          class="margin-label-geo"
          style="top: {yScale(sorted[0][idKey]).y +
            yScale(sorted[0][idKey]).height / 2}px;"
        >
          {pluralise(geoLevel.label)}
        </div>
      {/if}
      {#if width >= widthThreshold && sorted.length <= maxUnscaledBarsCount && !hovered}
        {#each sorted as s}
          <div
            class="margin-label-geo-all"
            style="top:{yScale(s[idKey]).y + yScale(s[idKey]).height / 2}px;"
          >
            {s[labelKey]}
          </div>
        {/each}
      {/if}
      <div class="margin-labels-selected" use:marginLabels>
        {#if width >= widthThreshold && !hoveredArea}
          {#each _selected as a, i (a[0][idKey])}
            {@const yPos = yLabelPositions?.[i] || yScale?.(a[0][idKey])?.y}
            {@const height = yScale?.(a[0][idKey])?.height}
            {@const isLabelDodged =
              yLabelPositions?.[i] !== yScale?.(a[0][idKey])?.y}
            <div
              class="margin-label-selected"
              style="top: {yPos ? yPos + height / 2 : 0}px;right:{isLabelDodged
                ? 'calc(100% + 16px)'
                : 'calc(100% + 8px)'};color:{ONStextPalette[i]}"
            >
              {a[0][labelKey]}
            </div>
          {/each}
        {/if}
      </div>
    </div>
    <svg
      viewBox="0 0 {widthInner} {height}"
      class="bar-chart"
      preserveAspectRatio="none"
      style:height="{height}px"
    >
      {#if _data && xScale && yScale}
        <g opacity={hoveredArea ? 0.2 : 1}>
          {#each sorted as b, i (b[idKey])}
            {@render bar(b, setBarColour(b[idKey]), 1, b[idKey], i)}
          {/each}
        </g>
        <g>
          {#if hoveredArea && hoveredIndex !== -1}
            {@render bar(hovered, "orange", 1, hoveredArea, hoveredIndex)}
          {/if}
        </g>
      {/if}
      {#if yLabelPositions?.[0] && !hovered}
        <g>
          {#each _selected as a, i (a[0][idKey])}
            {@const yPosAdj = yLabelPositions[i]}
            {@const yPosOrig = yScale(a[0][idKey]).y}
            {@const height = yScale(a[0][idKey]).height}
            {@const elbowX = xScale(0) - 6 - elbowOffset[i]}
            {#if Math.abs(yPosAdj - yPosOrig) > 0.75}
              <polyline
                stroke={ONScolours.grey60}
                fill="none"
                points="-14,{yPosAdj + height / 2}
                {elbowX},{yPosAdj + height / 2}
                {elbowX},{yPosOrig + height / 2} 
                -2,{yPosOrig + height / 2}"
              >
              </polyline>
            {:else if Math.abs(yPosAdj - yPosOrig) > 0}
              <polyline
                stroke={ONScolours.grey60}
                fill="none"
                points="-14,{yPosOrig + height / 2}
                -2,{yPosOrig + height / 2}"
              >
              </polyline>
            {:else}{/if}
          {/each}
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
    bottom: 100%;
    height: 10px;
    border-left: 1px solid grey;
  }

  .line-x-tick-label {
    position: absolute;
    bottom: calc(100% + 14px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
    line-height: 1;
  }

  .x-baseline {
    position: absolute;
    width: 100%;
    border-bottom: 2px solid grey;
    transform: translateY(-1px);
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
    text-align: right;
    line-height: 1.1;
    right: calc(100% + 8px);
  }

  .margin-label-selected {
    position: absolute;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: bold;
    max-width: 140px;
    text-align: right;
    line-height: 0.95;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .margin-label-geo,
  .margin-label-geo-all {
    position: absolute;
    transform: translateY(-50%);
    font-size: 16px;
    font-weight: bold;
    color: grey;
    max-width: 140px;
    text-align: right;
    line-height: 1.1;
    right: calc(100% + 8px);
  }
</style>
