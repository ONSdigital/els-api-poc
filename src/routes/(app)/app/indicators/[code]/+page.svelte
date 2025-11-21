<script lang="ts">
  //@ts-nocheck
  import { base, assets } from "$app/paths";
  import { afterNavigate } from "$app/navigation";
  import { setContext } from "svelte";
  import {
    Hero,
    NavSections,
    NavSection,
    Dropdown,
    Table,
    analyticsEvent,
    Header,
    LazyLoad,
  } from "@onsvisual/svelte-components";
  import { capitalise } from "@onsvisual/robo-utils";
  import { fetchChartDataV1 } from "$lib/utils.ts";
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import Map from "$lib/viz/Map.svelte";
  import Bar from "$lib/viz/Bar.svelte";
  import Line from "$lib/viz/Line.svelte";
  import { makePeriodFormatter } from "$lib/utils.ts";

  let { data } = $props();
  $inspect(data);

  function arrayJoin(arr, separators = [", ", " and "]) {
    if (arr.length < 2) return arr.join(separators[0]);
    return arr.slice(0, -1).join(separators[0]) + separators[1] + arr.slice(-1);
  }

  // const maxSelection = 10;

  const parseDate = (str) => {
    const intlString = str.split("/").reverse().join("-") + "T12:00";
    const date = new Date(intlString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  };

  export function pivotData(data, formatPeriod = (d) => d, filter = null) {
    const piv = {};

    for (const d of data) {
      if (!filter || filter.includes(d.areacd.slice(0, 3))) {
        if (!piv[d.areacd])
          piv[d.areacd] = { "Area code": d.areacd, "Area name": d.areanm };
        piv[d.areacd][formatPeriod(d["period"])] = d.value;
      }
    }

    return Object.keys(piv)
      .map((key) => piv[key])
      .sort((a, b) => a["Area name"].localeCompare(b["Area name"]));
  }

  let formatPeriod = $derived(makePeriodFormatter(data.indicator.periodFormat));

  let pageState = $state({
    selectedAreas: [],
    selectedGeoLevel: data.geoLevels.find(
      (g) => g.id === data.indicator.geography.initialLevel
    ),
    selectedPeriodRange: [
      data.periods[0],
      data.periods[data.periods.length - 1],
    ],
    showConfidenceIntervals: false,
    formatPeriod: () => formatPeriod,
  });
  setContext("pageState", pageState);
</script>

<Hero
  title={data.indicator.label}
  width="medium"
  meta={[
    {
      key: data.indicator.source.length === 1 ? "Data source" : "Data sources",
      value: arrayJoin(
        data.indicator.source.map(
          (s) => `<a href="${s.href}" target="_blank">${s.name}</a>`
        )
      ),
    },
    {
      key: "Published on",
      value: parseDate(data.indicator.updated),
    },
  ]}
  background="#eaeaea"
  titleBadge={{
    label: data.indicator.experimentalStatistic
      ? "Official statistics in development"
      : capitalise(data.indicator.topic),
    ariaLabel: `Topic: ${capitalise(data.indicator.topic)}`,
    color: "#003c57",
  }}
>
  <p class="ons-hero__text">
    {data.indicator.description}
  </p>
</Hero>

<NavSections>
  {#if data.indicator.standardised}
    <NavSection title="Map">
      <div class="row-container">
        <div class="content-dropdowns" data-html2canvas-ignore>
          <AreasModal />
          <OptionsModal />
        </div>
      </div>
      <LazyLoad>
        <div class="chart-container map-container">
          {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: pageState.selectedPeriodRange[1].slice(0, 10) } )}
            Fetching chart data
          {:then chartData}
            <Map data={chartData} />
          {:catch}
            Failed to load chart data
          {/await}
        </div>
      </LazyLoad>
    </NavSection>
  {/if}
  <NavSection title="Line">
    <LazyLoad>
      <div class="chart-container">
        {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: pageState.selectedPeriodRange.map( (p) => p.slice(0, 10) ) } )}
          Fetching chart data
        {:then chartData}
          <Line data={chartData} />
        {:catch}
          Failed to load chart data
        {/await}
      </div>
    </LazyLoad>
  </NavSection>
  <NavSection title="Bar">
    <LazyLoad>
      <div class="chart-container">
        {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: pageState.selectedPeriodRange[1].slice(0, 10) } )}
          Fetching chart data
        {:then chartData}
          <Bar data={chartData} />
        {:catch}
          Failed to load chart data
        {/await}
      </div>
    </LazyLoad>
  </NavSection>
  <NavSection title="Table">
    <LazyLoad>
      <div class="chart-container">
        {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: "all" } )}
          Fetching chart data
        {:then chartData}
          <Table
            data={pivotData(chartData, formatPeriod)}
            sortable
            compact
            height={400}
          />
        {:catch}
          Failed to load chart data
        {/await}
      </div>
    </LazyLoad>
  </NavSection>
</NavSections>

<style>
  .chart-container {
    display: block;
    width: 100%;
    min-height: 300px;
    margin-bottom: 32px;
  }
  .map-container {
    max-width: 400px;
  }
  .chart-container :global(svg) {
    overflow: visible;
  }
</style>
