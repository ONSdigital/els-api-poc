<script lang="ts">
  import { resolve } from "$app/paths";
  import { parseData } from "$lib/utils";
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
    LazyLoad,
  } from "@onsvisual/svelte-components";
  import Beeswarm from "$lib/components/charts/demo/Beeswarm.svelte";

  export let data;

  let selected;
  let area;
  let topics;

  async function fetchTopicsData(
    selected,
    geography = "ltla",
    time = "latest",
  ) {
    const exclude = ["population-by-age-and-sex"];

    const dataUrl = resolve(
      `/api/v1/data.cols.json?geo=${geography}&time=${time}`,
    );
    const data = await (await fetch(dataUrl)).json();

    const metaUrl = resolve(
      `/api/v1/metadata/indicators?hasGeo=${selected.areacd}`,
    );
    const metadata = await (await fetch(metaUrl)).json();

    // Filter out empty datasets
    const indicators = metadata
      .filter((meta) => !exclude.includes(meta.slug))
      .map((meta) => ({ meta, data: parseData(data[meta.slug]) }));

    const topics = Array.from(
      new Set(indicators.map((ind) => ind.meta.topic)),
    ).map((topic) => ({
      key: topic,
      label: topic[0].toUpperCase() + topic.slice(1),
      indicators: indicators.filter((ind) => ind.meta.topic === topic),
    }));
    return topics;
  }

  async function selectArea(selected) {
    if (!selected) {
      area = null;
      topics = null;
      return;
    }
    topics = await fetchTopicsData(selected);
    area = selected;
  }
</script>

<PhaseBanner phase="prototype" />
<Header compact title="Area chart demo" />
<Breadcrumb links={[{ label: "ELS API experiments", href: resolve("/") }]} />

<Section>
  <p style:margin="12px 0 32px">
    Select an area to display indicators. Chart data for all indicators will be
    loaded at once. (Note: Charts are rendered lazily as the performance of
    SveltePlot does not seem to be optimised for this use case).
  </p>
  <form
    class="select-container"
    on:submit|preventDefault={() => selectArea(selected)}
  >
    <Select
      options={data.areaList}
      bind:value={selected}
      labelKey="areanm"
      label="Select a local authority"
      placeholder="Eg. Fareham or Newport"
    />
    <Button small type="sumbit">Select area</Button>
  </form>
</Section>

{#if topics && area}
  <Divider />
  {#key topics}
    <NavSections>
      {#each topics as topic}
        <NavSection title={topic.label}>
          {#each topic.indicators as ind}
            <h3>{ind.meta.label}</h3>
            <div class="chart-container">
              <LazyLoad>
                <Beeswarm data={ind.data} selected={area} />
              </LazyLoad>
            </div>
          {/each}
        </NavSection>
      {/each}
    </NavSections>
  {/key}
{/if}

<Footer compact />

<style>
  :global(.ons-input) {
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
