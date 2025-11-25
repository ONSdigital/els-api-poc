<script>
  import { base } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer,
    Grid,
    DataCard
  } from "@onsvisual/svelte-components";
  import { makeValueFormatter, makePeriodFormatter } from "$lib/utils";

  let { data } = $props();

  

  async function fetchData() {
    const url = `${base}/api/v1/data.cols.json?excludeMultivariate=true&geo=E92000001&time=latest&measure=value`;
    const data = await (await fetch(url)).json();
    return data;
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Formats and units demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <p style:margin="12px 0 0">
    This demo auto-formats date strings, applies units and adds descriptions and sources to a sample value from each dataset for a single place (England). Data is for the latest time period available.
  </p>
</Section>

<Grid colWidth="medium" title="Indicators for England">
  {#await fetchData()}
    Fetching data
  {:then d}
    {#each Object.keys(d) as key}
      {@const meta = data.metadata.find(m => m.slug === key)}
      {@const formatValue = makeValueFormatter(meta.decimalPlaces)}
      {@const formatPeriod = makePeriodFormatter(meta.periodFormat)}
      <DataCard
        title={meta.label.split(" (")[0]}
        value="{meta.prefix}{formatValue(d[key].value[0])}{meta.suffix}"
        caption="{meta.subText || ""}<span class='nobr'> in {formatPeriod(d[key].period[0])}</span>"
        source="Source: {meta.source.map(m => m.name).join(", ")}"/>
    {/each}
  {:catch}
    Failed to load data
  {/await}
</Grid>

<Footer compact />

<style>
  :global(.nobr) {
    white-space: nowrap;
  }
</style>