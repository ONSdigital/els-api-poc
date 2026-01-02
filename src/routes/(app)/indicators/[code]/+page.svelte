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
  import {
    fetchChartDataV1,
    makePeriodFormatter,
    makeValueFormatter,
  } from "$lib/utils";
  import { countryLookup } from "$lib/config/geoLookups";
  import AreasLegend from "$lib/components/modals/AreasLegend.svelte";
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import Map from "$lib/components/charts/Map.svelte";
  import ContentBlock from "$lib/components/charts/ContentBlock.svelte";
  import IndicatorChart from "./IndicatorChart.svelte";
  import Bar from "$lib/components/charts/Bar.svelte";

  let { data } = $props();
  $inspect(data);

  let formatPeriod = $derived(makePeriodFormatter(data.indicator.periodFormat));
  let formatValue = $derived(makeValueFormatter(data.indicator.decimalPlaces));

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

  function pivotData(data, filter = null) {
    const piv = {};

    for (const d of data) {
      if (!filter || filter.includes(d.areacd.slice(0, 3))) {
        if (!piv[d.areacd])
          piv[d.areacd] = { areacd: d.areacd, areanm: d.areanm };
        piv[d.areacd][d.period] = d.value;
      }
    }

    return Object.values(piv);
  }

  function makeColumns(data) {
    return Object.keys(data[0]).map((key) => ({
      key,
      label:
        key === "areacd"
          ? "Area code"
          : key === "areanm"
            ? "Area name"
            : formatPeriod(key),
      numeric: !["areacd", "areanm"].includes(key),
      formatter: formatValue,
    }));
  }

  function getInitialSelection(data) {
    return [];
    // Need to add missing area codes to lookup to stop this from breaking
    return data.indicator.standardised === false
      ? []
      : data.areas.map((d) => d.areacd).includes("K02000001")
        ? ["K02000001"]
        : data.areas.map((d) => d.areacd).includes("K03000001")
          ? ["K03000001"]
          : data.indicator.geography.countries.length === 1
            ? data.indicator.geography.countries.map((d) => countryLookup[d])
            : [];
  }

  let pageState = $state({
    selectedAreas: getInitialSelection(data),
    selectedGeoLevel: data.geoLevels.find(
      (g) => g.id === data.indicator.geography.initialLevel,
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
          (s) => `<a href="${s.href}" target="_blank">${s.name}</a>`,
        ),
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

<NavSections cls="wider-nav-sections" marginTop>
  <div class="indicators-nav-sections">
    <div class="legend-sticky">
      <AreasLegend
        selectedAreas={pageState.selectedAreas}
        selectedGeoGroup={pageState.selectedGeoLevel}
      />
      <div>
        <AreasModal />
        <OptionsModal />
      </div>
    </div>
    {#if data.indicator.standardised}
      <NavSection title="Map">
        <ContentBlock
          title={data.indicator.label}
          source={data.indicator.source}
        >
          <p class="subtitle">
            {data.indicator.subtitle}, {pageState.selectedPeriodRange[0].slice(
              0,
              4,
            )}
            to {pageState.selectedPeriodRange[1].slice(0, 4)}
          </p>
          <LazyLoad>
            <div class="chart-container">
              {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: pageState.selectedPeriodRange[1].slice(0, 10) }, )}
                Fetching chart data
              {:then chartData}
                <Map
                  metadata={data.indicator}
                  data={chartData}
                  selected={pageState.selectedAreas.map((a) => a.areacd)}
                />
              {:catch}
                Failed to load chart data
              {/await}
            </div>
          </LazyLoad>
        </ContentBlock>
      </NavSection>
    {/if}

    {#if data.periods.length > 1}
      <NavSection title="Line chart">
        {#if pageState.selectedPeriodRange[0] === pageState.selectedPeriodRange[1]}
          <ContentBlock>
            <div class="no-chart-container">
              <p>
                Time series not displayed as selected date range includes only
                one time period with
                <span style="font-weight: bold;">{data.indicator.label}</span> data.
              </p>
            </div>
          </ContentBlock>
        {:else}
          <ContentBlock
            title={data.indicator.label}
            source={data.indicator.source}
          >
            <p class="subtitle">
              {data.indicator.subtitle}, {pageState.selectedPeriodRange[0].slice(
                0,
                4,
              )}
              to {pageState.selectedPeriodRange[1].slice(0, 4)}
            </p>
            <LazyLoad>
              <IndicatorChart
                indicator={data.indicator.slug}
                metadata={data.indicator}
                timeRange={pageState.selectedPeriodRange}
                selected={pageState.selectedAreas.map((a) => a.areacd)}
                geoLevel={pageState.selectedGeoLevel}
                {formatPeriod}
                chartType="line"
              />
            </LazyLoad>
          </ContentBlock>
        {/if}
      </NavSection>
    {/if}

    <NavSection title="Bar chart">
      <ContentBlock title={data.indicator.label} source={data.indicator.source}>
        <p class="subtitle">
          {data.indicator.subtitle}, {pageState.selectedPeriodRange[0].slice(
            0,
            4,
          )}
          to {pageState.selectedPeriodRange[1].slice(0, 4)}
        </p>
        <LazyLoad>
          <IndicatorChart
            indicator={data.indicator.slug}
            metadata={data.indicator}
            timeRange={pageState.selectedPeriodRange[1]}
            selected={pageState.selectedAreas.map((a) => a.areacd)}
            geoLevel={pageState.selectedGeoLevel}
            {formatPeriod}
            chartType="bar"
          />
        </LazyLoad>
      </ContentBlock>
    </NavSection>
    <NavSection title="Table">
      <ContentBlock title={data.indicator.label} source={data.indicator.source}>
        <p class="subtitle">
          {data.indicator.subtitle}, {pageState.selectedPeriodRange[0].slice(
            0,
            4,
          )}
          to {pageState.selectedPeriodRange[1].slice(0, 4)}
        </p>
        <LazyLoad>
          <div class="chart-container">
            {#await fetchChartDataV1( data.indicator.slug, { geo: pageState.selectedGeoLevel.id, time: "all" }, )}
              Fetching chart data
            {:then chartData}
              {@const pivotedData = pivotData(chartData)}
              <Table
                data={pivotedData}
                columns={makeColumns(pivotedData)}
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
  </div>
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
          `/api/v1/data.ods?indicator=${data.indicator.slug}&time=all`,
        )}
        download={`${data.indicator.slug}.ods`}>ODS</a
      >,
      <a
        href={resolve(
          `/api/v1/data.csv?indicator=${data.indicator.slug}&time=all`,
        )}
        download={`${data.indicator.slug}.csv`}>CSV</a
      >,
      <a
        href={resolve(
          `/api/v1/data.csvw?indicator=${data.indicator.slug}&time=all`,
        )}
        download={`${data.indicator.slug}.csv-metadata.json`}>CSVW</a
      >
      or
      <a
        href={resolve(
          `/api/v1/data.json?indicator=${data.indicator.slug}&time=all`,
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
      Information on the strengths and limitations of the Explore Local
      Statistics service and methods used is available in the
      <a
        href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
        >quality and methodology information (QMI) report</a
      >.
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
  .chart-container :global(svg) {
    overflow: visible;
  }
  .legend-sticky {
    z-index: 1;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--ons-color-page-light);
    padding: 0.5em 0;
  }
</style>
