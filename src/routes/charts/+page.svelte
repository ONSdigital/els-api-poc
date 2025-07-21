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
  import Beeswarm from "$lib/viz/Beeswarm.svelte";
  import areas from "$lib/areas.json";
  import metadata from "$lib/metadata.json";
  import { fetchChartData } from "$lib/utils.js";

  let selected;
  let area;
  let topics;

  function selectArea(selected) {
    if (!selected) {
      area = null;
      topics = null;
      return;
    };
    area = selected;
    const indicators = Object.values(metadata).filter(ind => ind.inferredGeos.types.includes(area.areacd.slice(0, 3)));
    topics = Array.from(new Set(indicators.map(ind => ind.topic)))
      .map(topic => ({
        key: topic,
        label: `${topic[0].toUpperCase()}${topic.slice(1)}`,
        indicators: indicators.filter(ind => ind.topic === topic)
      }));
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Lazy charts demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Select an area to display indicators. Chart data for each indicator will be lazy loaded when the chart comes into view on the page.
  </p>
  <form class="select-container" on:submit|preventDefault={() => selectArea(selected)}>
    <Select options={areas} bind:value={selected} labelKey="areanm" label="Select a local authority" placeholder="Eg. Fareham or Newport"/>
    <Button small type="sumbit">Select area</Button>
  </form>
</Section>

{#if topics}
  <Divider/>
  <NavSections>
    {#each topics as topic}
      <NavSection title={topic.label}>
        {#each topic.indicators as ind}
        <h3>{ind.metadata.label}</h3>
        <LazyLoad>
          <div class="chart-container">
            {#await fetchChartData(ind.code)}
              Fetching chart data
            {:then chartData}
              <Beeswarm data={chartData} selected={area}/>
            {:catch}
              Failed to load chart data
            {/await}
          </div>
        </LazyLoad>
      {/each}
      </NavSection>
    {/each}
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
    height: 100px;
    margin-bottom: 32px;
  }
  .chart-container :global(svg) {
    overflow: visible;
  }
</style>