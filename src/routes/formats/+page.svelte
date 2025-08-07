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
  import metadata from "$lib/metadata.json";

  export let data;

  function formatDate(str) {
    const parts = str.split("/");
    const date = new Date(parts[0]);
    const period = parts?.[1];
    const type = period === "P3M" ? "quarter" :
      period === "P1Y" ? "12months" :
      period === "P3Y" ? "36months" :
      period?.match(/\d{4}/) ? "fy" :
      parts[0].length === 7 ? "month" :
      "year";
    const endDate = !period ? null :
      type === "fy" ? new Date(period) :
      type === "36months" ? utcDay.offset(utcYear.offset(date, 3), -1) :
      type === "12months" && parts[0].slice(5) !== "01-01" ? utcYear.offset(date, 1) :
      null;
    return type === "quarter" ? `Q${utcFormat("%q %Y")(date)}` :
      type === "month" ? utcFormat("%b %Y")(date) :
      endDate ? `${type === "fy" ? "FY " : ""}${utcFormat("%Y")(date)}-${utcFormat("%y")(endDate)}` :
      utcFormat("%Y")(date);
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
  {#each Object.keys(data) as key}
    {@const meta = metadata[key].metadata}
    <DataCard
      title="{meta.label.split(" (")[0]}"
      value="{meta.prefix}{format(`,.${meta.decimalPlaces}f`)(data[key].value[0])}{meta.suffix}"
      caption="{meta.subText ? `${meta.subText} ` : ""}<span class='nobr'>in {formatDate(data[key].date[0])}</span>"
      source="Source: {meta.sourceOrg.split("|").join(", ")}"/>
  {/each}
</Grid>

<Footer compact />

<style>
  :global(.nobr) {
    white-space: nowrap;
  }
</style>