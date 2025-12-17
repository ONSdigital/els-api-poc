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

  const barHeight = 35;
  const height = 300;
  let width = $state();
  const widthThreshold = 550;
  let rightMargin = $derived(width < widthThreshold ? 20 : 150);
  // let widthInner = $derived(width - rightMargin - leftMargin);
  let widthInner = $derived(width - 20 - 40);

  const barGap = 1; // actual size of barGap in pixels
  const barGapScale = (1 / barHeight) * barGap;

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );

  let xScale = $derived(
    _data
      ? scaleLinear().domain(_data.valueDomain).range([0, widthInner])
      : null
  );

  let yScale = $derived(
    _data
      ? scaleBand()
          .domain(Object.keys(_data.keyed))
          .range([height, 0])
          .paddingInner(barGapScale)
      : null
  );

  $inspect(_data);
  $inspect(Object.values(_data.keyed)[0]);
</script>

{#snippet bar(b, color = "#b0b0b0", opacity = 1, id = "")}
  <rect
    class="chart-bars"
    x={0}
    y={yScale(b[idKey])}
    width={xScale(b[yKey])}
    height={yScale.bandwidth()}
    fill={color}
    {opacity}
    on:pointerenter={() => {
      hoveredArea = id;
    }}
    on:pointerleave={() => {
      hoveredArea = null;
    }}
  />
{/snippet}

<p>Some invisible bars</p>

<div
  bind:clientWidth={width}
  class="bar-wrapper"
  style:padding-left="{30}px"
  style:padding-top="0px"
  style:padding-bottom="25px"
  style:padding-right="{rightMargin}px"
>
  <div class="bar-inner">
    <svg
      viewBox="0 0 {widthInner} {height}"
      class="bar-chart"
      preserveAspectRatio="none"
    >
      {#if _data && xScale && yScale}
        <g opacity={hoveredArea ? 0.2 : 1}>
          {#each Object.values(_data.keyed) as b, i}
            {@render bar(b, "#b0b0b0", 1, b[0][idKey])}
          {/each}
        </g>
      {/if}
    </svg>
  </div>
</div>
