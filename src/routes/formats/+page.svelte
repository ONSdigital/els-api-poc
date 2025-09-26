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
  import { format } from "d3-format";
  import { utcFormat } from "d3-time-format";
  import { utcYear, utcDay } from "d3-time";
  import metadata from "$lib/data/metadata.json";

  function formatDate(str) {
    const parts = str.split("/");
    const date = new Date(parts[0]);
    const period = parts?.[1];
    const type = period === "P3M" ? "quarter" :
      period === "P3Y" ? "36months" :
      period?.match(/^\d{4}/) ? "FY" :
      period === "P1Y" && ["08-01", "09-01"].includes(parts[0].slice(5)) ? "AY" :
      period === "P1Y" && parts[0].slice(5) === "01-01" ? "year" :
      period === "P1Y" ? "12months" :
      parts[0].length > 6 ? "month" :
      "year";
    const endDate = type === "36months" ? utcDay.offset(utcYear.offset(date, 3), -1) :
      ["12months", "FY", "AY"].includes(type) ? utcDay.offset(utcYear.offset(date, 1), -1) :
      null;
    return type === "quarter" ? `Q${utcFormat("%q %Y")(date)}` :
      type === "month" ? utcFormat("%b %Y")(date) :
      endDate ? `${type?.length === 2 ? `${type} ` : ""}${utcFormat("%Y")(date)}-${utcFormat("%y")(endDate)}` :
      utcFormat("%Y")(date);
  }

  async function fetchData() {
    const url = `${base}/api/v1/data.json?geography=E92000001&time=latest&measure=value`;
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
  {:then data}
    {#each Object.keys(data) as key}
      {@const meta = metadata[key].metadata}
      <DataCard
        title={meta.label.split(" (")[0]}
        value="{meta.prefix}{format(`,.${meta.decimalPlaces}f`)(data[key].value[0])}{meta.suffix}"
        caption="{meta.subText ? `${meta.subText} ` : ""}<span class='nobr'>in {formatDate(data[key].period[0])}</span>"
        source="Source: {meta.sourceOrg.split("|").join(", ")}"/>
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