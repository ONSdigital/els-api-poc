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
  import { Plot, Dot, Text, jitterY } from "svelteplot";
  import areas from "$lib/areas.json";
  import metadata from "$lib/metadata.json";

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

  function parseData(data) {
    const cols = Object.keys(data);
    const rows = [];

    for (let i = 0; i < data[cols[0]].length; i ++) {
      const row = {y: 0};
      for (const col of cols) row[col] = data[col][i];
      rows.push(row);
    }
    return rows;
  }

  async function fetchChartData(indicator, geography = "ltla") {
    const url = `${base}/api.json?indicator=${indicator}&geograph=${geography}&time=latest`;
    const data = await (await fetch(url)).json();
    return parseData(data[indicator]);
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Charts test" />
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
              {@const props = jitterY(
                  { data: chartData, x: "value", y: "y" },
                  { type: "uniform" }
                )}
              <Plot height={100} y={{axis: false}} r={{range: [3, 5]}}>
                <Dot {...props}
                  fill={d => d.areacd === area.areacd ? "black" : "rgba(0,0,0,0.1)"}
                  r={d => d.areacd === area.areacd ? 2 : 1}/>
                <Text
                  data={props.data.filter(d => d.areacd === area.areacd)}
                  x={props.x}
                  y={props.y}
                  dy={-5}
                  lineAnchor="bottom"
                  fill="black"
                  stroke="white"
                  strokeWidth={4}
                  strokeOpacity={0.7}
                  text={area.areanm} />
              </Plot>
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