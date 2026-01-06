<script lang="ts">
  import {
    makeDataUrl,
    makeValueFormatter,
    makePeriodFormatter,
  } from "$lib/utils";
  import { Observe } from "@onsvisual/svelte-components";
  import Line from "$lib/components/charts/Line.svelte";
  import Map from "$lib/components/charts/Map.svelte";
  import Bar from "$lib/components/charts/Bar.svelte";
  import Table from "$lib/components/charts/Table.svelte";

  let {
    indicator,
    metadata,
    timeRange,
    selected = [],
    geoLevel,
    hovered = $bindable(),
    formatValue,
    formatPeriod,
    chartType,
  } = $props();

  let visible = $state();

  let loadedChartDataUrl;
  let chartData;

  async function fetchData(
    indicator,
    timeRange,
    selected,
    geoLevel,
    chartType,
    visible,
  ) {
    if (!visible && chartData) return chartData;
    else if (!visible) return null;
    const chartDataUrl = makeDataUrl(
      indicator,
      ["line", "table"].includes(chartType) ? timeRange : timeRange[1],
      "latest",
      selected,
      geoLevel,
    );
    if (chartDataUrl !== loadedChartDataUrl) {
      console.log(`Loading ${indicator} ${chartType} data`);
      loadedChartDataUrl = chartDataUrl;
      try {
        chartData = await (await fetch(chartDataUrl)).json();
        console.log(`Loaded ${indicator} ${chartType} data`);
        return chartData;
      } catch {
        console.log(`Failed to load ${indicator} ${chartType} data`);
        return null;
      }
    } else return chartData;
  }

  const chartComponents = {
    map: Map,
    line: Line,
    bar: Bar,
    table: Table,
  };
</script>

<Observe bind:visible>
  <div class="indicator-chart">
    {#await fetchData(indicator, timeRange, selected, geoLevel.id, chartType, visible) then chartData}
      {@const Component = chartComponents[chartType]}
      {#if chartData}
        <Component
          data={chartData}
          {metadata}
          {formatValue}
          {selected}
          bind:hovered
          {formatPeriod}
          {geoLevel}
        />
      {/if}
    {/await}
  </div>
</Observe>

<style>
  .indicator-chart {
    min-height: 400px;
  }
</style>
