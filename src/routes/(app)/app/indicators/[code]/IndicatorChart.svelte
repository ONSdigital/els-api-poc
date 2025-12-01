<script lang="ts">
  import { Observe } from "@onsvisual/svelte-components";
  import {
    makeDataUrl,
    makeValueFormatter,
    makePeriodFormatter,
  } from "$lib/utils";
  import Line from "$lib/viz/LineNew.svelte";

  let {
    indicator,
    timeRange,
    selected = [],
    geoLevel,
    hovered = $bindable(),
  } = $props();

  let visible = $state();
  let formatValue = $derived(makeValueFormatter(indicator.decimalPlaces));
  //   let formatPeriod = $derived(makePeriodFormatter(indicator.periodFormat));

  let loadedChartUrl = $state();
  let chartData = $state();

  async function fetchData(indicator, timeRange, selected, visible) {
    const chartUrl = makeDataUrl(indicator, timeRange, null, selected);
    console.log(chartUrl);
    if (chartUrl !== loadedChartUrl) {
      try {
        chartData = await (await fetch(chartUrl)).json();
      } catch {
        console.log("Failed to load chart data");
      }
      loadedChartUrl = chartUrl;
    }
  }

  $effect(async () => {
    fetchData(indicator, timeRange, selected, visible);
  });
</script>

<div class="line-chart">
  <Line
    data={chartData || { message: "No data" }}
    {formatValue}
    {visible}
    {selected}
    bind:hovered
  />
</div>
