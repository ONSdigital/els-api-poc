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
  import areas from "$lib/data/areas.json";
  import { fetchTopicsData } from "$lib/utils.js";

  let selected;
  let area;
  let topics;

  async function selectArea(selected) {
    if (!selected) {
      area = null;
      topics = null;
      return;
    };
    topics = await fetchTopicsData(selected);
    area = selected;
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Area chart demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Select an area to display indicators. Chart data for all indicators will be loaded at once. (Note: Charts are rendered lazily as the performance of SveltePlot does not seem to be optimised for this use case).
  </p>
  <form class="select-container" on:submit|preventDefault={() => selectArea(selected)}>
    <Select options={areas} bind:value={selected} labelKey="areanm" label="Select a local authority" placeholder="Eg. Fareham or Newport"/>
    <Button small type="sumbit">Select area</Button>
  </form>
</Section>

{#if topics && area}
  <Divider/>
  {#key topics}
    <NavSections>
      {#each topics as topic}
        <NavSection title={topic.label}>
          {#each topic.indicators as ind}
            <h3>{ind.meta.metadata.label}</h3>
            <div class="chart-container">
              <LazyLoad>
                <Beeswarm data={ind.data} selected={area}/>
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