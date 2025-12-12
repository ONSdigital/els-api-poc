<script lang="ts">
  import {
    makeDataUrl,
    makeValueFormatter,
    makePeriodFormatter,
  } from "$lib/utils";
  import Line from "$lib/components/charts/LineNew.svelte";

  let {
    indicator,
    metadata,
    timeRange,
    selected = [],
    geoLevel,
    hovered = $bindable(),
    formatPeriod,
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
</script>

<div class="line-chart">
  {#await fetchData(indicator, timeRange, selected, geoLevel)}
    Fetching chart data
  {:then chartData}
    <Line
      data={chartData || { message: "No data" }}
      {formatValue}
      {selected}
      bind:hovered
      {formatPeriod}
    />
  {:catch}
    Failed to load chart data
  {/await}
</div>
