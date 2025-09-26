<script>
  import { base } from "$app/paths";
  import { page } from "$app/state";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer,
    Details,
    Dropdown,
    Input,
    Button,
    Table,
    Indent,
    NavSections,
    NavSection,
    Divider
  } from "@onsvisual/svelte-components";
  import metadata from "$lib/data/metadata.json";
  import { geoLevels } from "$lib/config/geo-levels.js";
  import measures from "$lib/config/measures.js";
  import topics from "$lib/config/topics.js";

  const indicators = Object.values(metadata);
  const indicatorsList = [
    {id: "all", label: "All indicators"},
    {id: "topic", label: "Select by topic"},
    ...indicators.map(ind => ({id: ind.code, label: ind.metadata.label})).sort((a, b) => a.label.localeCompare(b.label))
  ];
  let indicator = indicatorsList[2];

  let topic = topics[0];

  const geographyList = [
    {id: "all", label: "All geographies"},
    {id: "code", label: "Enter a GSS code"},
    ...Object.keys(geoLevels).map(key => ({id: key, label: geoLevels[key].label}))
  ];
  let geography = geographyList[0];
  let gssCode = "K02000001";

  const years = Array.from(new Set(indicators.map(ind => ind.years).flat()))
    .filter(d => Math.floor(d) === d)
    .sort((a, b) => a - b);
  const yearsList = [{id: "all", label: "All years"}, ...years.map(y => ({id: y, label: y})).reverse()];
  let year = yearsList[0];

  let measure = measures[0];

  let data;
  let startFetch;

  async function getData(permalink) {
    startFetch = new Date();
    data = await (await fetch(permalink)).json();
  }

  function parseData(data) {
    const parsedData = [];

    for (const ind of Object.keys(data)) {
      const obj = {id: ind, label: metadata[ind].metadata.label, values: []};
      const dat = data[ind];
      const cols = Object.keys(dat);

      for (let i = 0; i < dat[cols[0]].length; i ++) {
        const row = {};
        for (const col of cols) row[col] = dat[col][i];
        obj.values.push(row);
      }
      parsedData.push(obj);
    }
    return parsedData;
  }

  $: permalink = (format = "json") => `${page.url.origin}${base}/api/v1/data.${format}?${
      indicator.id === "topic" ? `topic=${topic.id}` : `indicator=${indicator.id}`
    }&geography=${
      geography.id === "code" ? gssCode : geography.id
    }&time=${year.id}${year.id !== "all" ? "latest" : ""}&measure=${measure.id}`;
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Query-based API" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Construct a query by indicator, geography and time period to view filtered data.
    You can download the data in a JSON or CSV format and see the permalink for your selection.
  </p>

  <Details title="Select your filters">
    <Dropdown label="Select indicator" options={indicatorsList} bind:value={indicator}/>
    {#if indicator.id === "topic"}
      <Indent><Dropdown label="Select topic" options={topics} bind:value={topic}/></Indent>
    {/if}
    <Dropdown label="Select geography" options={geographyList} bind:value={geography}/>
    {#if geography.id === "code"}
      <Indent><Input label="Type a GSS code" bind:value={gssCode}/></Indent>
    {/if}
    <Dropdown label="Select year" options={yearsList} bind:value={year}/>
    <Dropdown label="Select measure" options={measures} bind:value={measure}/>
  </Details>

  <Input label="Permalink" value={permalink()} width={100} disabled/>
  <Button small on:click={() => getData(permalink())}>View data</Button>
  <Button small href={permalink()} name="datadownload.json">Download JSON</Button>
  <Button small href={permalink("csv")} name="datadownload.json">Download CSV</Button>
</Section>

{#if data}
  <Divider/>
  {#key data}
    <Section marginTop="{true}">Data returned by API in {((new Date()) - startFetch) / 1000} seconds.</Section>
    <NavSections>
        {#each parseData(data) as ind}
          <NavSection title={ind.label}>
            {#if ind.values[0]}
              <Table compact height={300} data={ind.values}/>
            {:else}
              <p>No values available for this indicator.</p>
            {/if}
            <div class="ons-u-mb-3xl"></div>
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
</style>