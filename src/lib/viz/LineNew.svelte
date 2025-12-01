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
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );

  $inspect(data);

  let xScale = $derived(
    _data ? scaleLinear().domain(_data.dateDomain).range([0, 100]) : null
  );
  let yScale = $derived(
    _data ? scaleLinear().domain(_data.valueDomain).range([100, 0]) : null
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

<div>
  {#if xScale && yScale}
    <g>
      {#each Object.values(_data.keyed) as arr, i}
        {@render line(arr, 2, ONSpalette[i])}
      {/each}
    </g>
  {/if}
</div>
