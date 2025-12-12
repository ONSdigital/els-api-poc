<script lang="ts">
  //@ts-nocheck
  import { base, assets, resolve } from "$app/paths";
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
    List,
    Li,
  } from "@onsvisual/svelte-components";
  import { capitalise } from "@onsvisual/robo-utils";
  import { fetchChartDataV1, makePeriodFormatter } from "$lib/utils";
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import Map from "$lib/components/charts/Map.svelte";
  import Bar from "$lib/components/charts/Bar.svelte";
  import Line from "$lib/components/charts/Line.svelte";
  import ContentBlock from "$lib/components/charts/ContentBlock.svelte";
  import IndicatorChart from "./IndicatorChart.svelte";

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

  const countryLookup = {
    N: "N92000002",
    E: "E92000001",
    W: "W92000004",
    S: "S92000003",
  };

  let initialSelected = $derived(
    data.indicator.standardised === false
      ? []
      : data.areas.map((d) => d.areacd).includes("K02000001")
        ? ["K02000001"]
        : data.areas.map((d) => d.areacd).includes("K03000001")
          ? ["K03000001"]
          : data.indicator.geography.countries.length == 1
            ? data.indicator.geography.countries.map((d) => countryLookup[d])
            : []
  );

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

<NavSections marginTop>
  <div class="row-container">
    <div class="content-dropdowns" data-html2canvas-ignore>
      <AreasModal />
      <OptionsModal />
    </div>
  </div>
  {#if data.indicator.standardised}
    <NavSection title="Map">
      <ContentBlock title={data.indicator.label} source={data.indicator.source}>
        <p class="subtitle">
          {data.indicator.subtitle}, {pageState.selectedPeriodRange.map((p) =>
            p.slice(0, 4)
          )}
        </p>
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
      </ContentBlock>
    </NavSection>
  {/if}

  <NavSection title="Line chart">
    <ContentBlock title={data.indicator.label} source={data.indicator.source}>
      <p class="subtitle">
        {data.indicator.subtitle}, {pageState.selectedPeriodRange.map((p) =>
          p.slice(0, 4)
        )}
      </p>
      <LazyLoad>
        <IndicatorChart
          indicator={data.indicator.slug}
          metadata={data.indicator}
          timeRange={pageState.selectedPeriodRange}
          selected={initialSelected.concat(
            pageState.selectedAreas.map((a) => a.areacd)
          )}
          geoLevel={pageState.selectedGeoLevel}
          {formatPeriod}
        />
      </LazyLoad>
    </ContentBlock>
  </NavSection>

  <NavSection title="Bar chart">
    <ContentBlock title={data.indicator.label} source={data.indicator.source}>
      <p class="subtitle">
        {data.indicator.subtitle}, {pageState.selectedPeriodRange.map((p) =>
          p.slice(0, 4)
        )}
      </p>
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
    </ContentBlock>
  </NavSection>
  <NavSection title="Table">
    <ContentBlock title={data.indicator.label} source={data.indicator.source}>
      <p class="subtitle">
        {data.indicator.subtitle}, {pageState.selectedPeriodRange.map((p) =>
          p.slice(0, 4)
        )}
      </p>
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
    </ContentBlock>
  </NavSection>
  <NavSection title="Get the data">
    <p>The original data source for this indicator can be found here:</p>
    <List mode="dash">
      {#each data.indicator.source as s}
        <Li><a href={s.href} target="_blank">{s.name}</a></Li>
      {/each}
    </List>
    <p>
      You can download this dataset in an <a
        href={resolve(
          `/api/v1/data.ods?indicator=${data.indicator.slug}&time=all`
        )}
        download={`${data.indicator.slug}.ods`}>ODS</a
      >,
      <a
        href={resolve(
          `/api/v1/data.csv?indicator=${data.indicator.slug}&time=all`
        )}
        download={`${data.indicator.slug}.csv`}>CSV</a
      >,
      <a
        href={resolve(
          `/api/v1/data.csvw?indicator=${data.indicator.slug}&time=all`
        )}
        download={`${data.indicator.slug}.csv-metadata.json`}>CSVW</a
      >
      or
      <a
        href={resolve(
          `/api/v1/data.json?indicator=${data.indicator.slug}&time=all`
        )}
        download={`${data.indicator.slug}.json`}>JSON-Stat</a
      >
      format, or download
      <a
        href={resolve(`/api/v1/data.ods?excludeMultivariate=true&time=all`)}
        download="datasets.ods">all available datasets (ODS, ~10MB)</a
      >.
    </p>
    <p>
      Quality and Methodology Information for the Explore Local Statistics
      service details the strengths and limitations of the service, methods
      used, data uses and users.
    </p>
  </NavSection>
  <NavSection title="Other indicators">
    <p>
      {data.indicator.label} is one of {data.taxonomy.meta.count} local indicators
      on the <a href={resolve("/")}>Explore local statistics</a> service. See
      the <a href={resolve("/indicators")}>full list of local indicators</a>.
    </p>
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
