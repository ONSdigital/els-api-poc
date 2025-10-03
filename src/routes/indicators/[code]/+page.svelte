<script>
  import { resolve } from '$app/paths';
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer,
    NavSections,
    NavSection,
    LazyLoad
  } from "@onsvisual/svelte-components";
  import Map from "$lib/viz/Map.svelte";
  import Bar from "$lib/viz/Bar.svelte";
  import Line from "$lib/viz/Line.svelte";
  import { fetchChartData } from "$lib/utils.js";

  export let data;
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="{data.indicator.label}" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/"), label: "Indicators", href: resolve("/indicators")}]}/>

<Section>
  <p style:margin="12px 0 32px">
    {data.indicator.description}
  </p>
</Section>

<NavSections>
  <NavSection title="Map">
    <LazyLoad>
      <div class="chart-container map-container">
        {#await fetchChartData(data.indicator.code, "ltla")}
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
        {#await fetchChartData(data.indicator.code, "rgn")}
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
        {#await fetchChartData(data.indicator.code, "ltla", "all")}
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

<Footer compact />

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