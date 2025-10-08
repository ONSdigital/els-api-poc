<script>
  import { base } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer,
    Select,
    Button,
    Divider,
    NavSections,
    NavSection,
    LazyLoad
  } from "@onsvisual/svelte-components";
  import metadata from "$lib/data/metadata.json";
  import Map from "$lib/viz/Map.svelte";
  import Bar from "$lib/viz/Bar.svelte";
  import Line from "$lib/viz/Line.svelte";
  import { fetchChartData } from "$lib/utils.js";

  const indicators = Object.values(metadata).map(ind => ({id: ind.code, label: ind.metadata.label}));

  let selected;
  let indicator;

  function selectIndicator(selected) {
    indicator = !selected ? null : selected;
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Single indicator demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Select an indicator to view data as a map, bar and line chart. Chart data for each indicator will be lazy loaded when the chart comes into view on the page.
  </p>
  <form class="select-container" on:submit|preventDefault={() => selectIndicator(selected)}>
    <Select options={indicators} bind:value={selected} label="Select an indicator" placeholder="Eg. Household income"/>
    <Button small type="sumbit">Select area</Button>
  </form>
</Section>

{#if indicator}
  <Divider/>
  <NavSections>
    <NavSection title="Map">
      <LazyLoad>
        <div class="chart-container map-container">
          {#await fetchChartData(indicator.id)}
            Fetching chart data
          {:then chartData}
            <Map data={chartData}/>
          {:catch}
            Failed to load chart data
          {/await}
        </div>
      </LazyLoad>
    </NavSection>
    <NavSection title="Bar">
      <LazyLoad>
        <div class="chart-container">
          {#await fetchChartData(indicator.id)}
            Fetching chart data
          {:then chartData}
            <Bar data={chartData}/>
          {:catch}
            Failed to load chart data
          {/await}
        </div>
      </LazyLoad>
    </NavSection>
    <NavSection title="Line">
      <LazyLoad>
        <div class="chart-container">
          {#await fetchChartData(indicator.id, "ltla", "all")}
            Fetching chart data
          {:then chartData}
            <Line data={chartData}/>
          {:catch}
            Failed to load chart data
          {/await}
        </div>
      </LazyLoad>
    </NavSection>
  </NavSections>
{/if}

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
  .select-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
    width: 100%;
    gap: 6px;
  }
  .select-container > :global(div) {
    flex-grow: 1;
  }
  .select-container > :global(button) {
    flex-shrink: 1;
    padding-bottom: 4px;
  }
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