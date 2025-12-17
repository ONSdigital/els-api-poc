<script lang="ts">
  import {
    makeDataUrl,
    makeValueFormatter,
    makePeriodFormatter,
  } from "$lib/utils";
  import Line from "$lib/components/charts/Line.svelte";
  import Map from "$lib/components/charts/Map.svelte";
  import Bar from "$lib/components/charts/Bar.svelte";

  let {
    indicator,
    metadata,
    timeRange,
    selected = [],
    geoLevel,
    hovered = $bindable(),
    formatPeriod,
    chartType,
  } = $props();

  let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));

  async function fetchData(indicator, timeRange, selected, geoLevel) {
    const chartUrl = makeDataUrl(
      indicator,
      timeRange,
      null,
      selected,
      geoLevel.id
    );
    console.log({ chartUrl });
    try {
      const response = await fetch(chartUrl);
      const chartData = await response.json();
      return chartData;
    } catch {
      console.log("Failed to load chart data");
      return { message: "Failed" };
    }
  }

  const chartComponents = {
    map: Map,
    line: Line,
    bar: Bar,
  };
</script>

<div class="indicator-chart">
  {#await fetchData(indicator, timeRange, selected, geoLevel)}
    Fetching chart data
  {:then chartData}
    <svelte:component
      this={chartComponents[chartType]}
      data={chartData || { message: "No data" }}
      {formatValue}
      {selected}
      bind:hovered
      {formatPeriod}
      {geoLevel}
    />
  {:catch}
    Failed to load chart data
  {/await}
</div>
