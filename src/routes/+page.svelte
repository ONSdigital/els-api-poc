<script>
  import { base } from "$app/paths";
  import { page } from "$app/state";
  import {
    Header,
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
  import metadata from "$lib/metadata.json";
  import geoGroups from "$lib/geo-groups.js";
  import measures from "$lib/measures.js";
  import topics from "$lib/topics.js";

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
    ...Object.keys(geoGroups).map(key => ({id: key, label: geoGroups[key].label}))
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

  async function getData(permalink) {
    data = await (await fetch(permalink)).json();
  }

  function parseData(data) {
    const _data = !["all", "topic"].includes(indicator.id) ? {[indicator.id]: data} : data;
    const parsedData = [];

    for (const ind of Object.keys(_data)) {
      const obj = {id: ind, label: metadata[ind].metadata.label, values: []};
      const dat = _data[ind];
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

  $: permalink = `${page.url.origin}${base}/data/${indicator.id === "topic" ? topic.id : indicator.id}/${geography.id === "code" ? gssCode : geography.id}/${year.id}/${measure.id}.json`;
</script>

<Header compact title="ELS filter API experiment" />

<Section marginTop="{true}">
  <p style:margin-bottom="32px">
    Construct a query by indicator, geography and time period to view filtered data.
    You can download the data in a JSON format using the permalink provided.
  </p>

  <Details title="Select your filters">
    <Dropdown label="Select indicator" options={indicatorsList} bind:value={indicator}/>
    {#if indicator.id === "topic"}
      <Indent><Dropdown label="Select topic" options={topics} bind:value={topic}/></Indent>
    {/if}
    <Dropdown label="Select geography" options={geographyList} bind:value={geography}/>
    {#if geography.id === "code"}
      <Indent><Input label="Type a GSS code" bind:value={gssCode} disabled/></Indent>
    {/if}
    <Dropdown label="Select year" options={yearsList} bind:value={year}/>
    <Dropdown label="Select measure" options={measures} bind:value={measure}/>
  </Details>

  <Input label="Permalink" value={permalink} width={100} disabled/>
  <Button small on:click={() => getData(permalink)}>View data</Button>
  <Button small href={permalink} name="datadownload.json">Download JSON</Button>
</Section>

{#if data}
  <Divider/>
  <NavSections>
    {#each parseData(data) as ind}
      <NavSection title={ind.label}>
        {#if ind.values[0]}
          <Table compact height={300} data={ind.values}/>
        {:else}
          <p>No values available for this indicator.</p>
        {/if}
        <div style:height="32px"></div>
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
</style>