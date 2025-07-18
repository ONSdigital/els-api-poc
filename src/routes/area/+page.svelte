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

  async function fetchData(selected, geography = "ltla") {
    const url = `${base}/api.json?geography=${geography}&time=latest`;
    let data = await (await fetch(url)).json();

    // Filter out empty datasets
    const indicators = Object.keys(data).map(key => {
      const meta = metadata[key];
      return {meta, data: parseData(data[key])};
    }).filter(ind => ind.meta.inferredGeos.types.includes(selected.areacd.slice(0, 3)))
      .filter(ind => ind.data[0])
    topics = Array.from(new Set(indicators.map(ind => ind.meta.topic)))
      .map(topic => ({
        key: topic,
        label: `${topic[0].toUpperCase()}${topic.slice(1)}`,
        indicators: indicators.filter(ind => ind.meta.topic === topic)
      }));
    return topics;
  }

  async function selectArea(selected) {
    if (!selected) {
      area = null;
      topics = null;
      return;
    };
    topics = await fetchData(selected);
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
            {@const props = jitterY(
              { data: ind.data, x: "value", y: "y" },
              { type: "uniform" }
            )}
            <h3>{ind.meta.metadata.label}</h3>
            <div class="chart-container">
              <LazyLoad>
              <Plot height={100} y={{axis: false}}>
                <Dot {...props}
                  fill="#99999955"
                  r={4}/>
                <Dot
                  data={props.data.filter(d => d.areacd === area.areacd)}
                  x={props.x}
                  y={props.y}
                  fill="#206095"
                  r={6}/>
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