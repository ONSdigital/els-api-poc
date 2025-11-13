<script>
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer,
    Details,
    Input,
    Button,
    Dropdown,
    Checkbox,
    Radios,
  } from "@onsvisual/svelte-components";
  import ChipGroup from "./ChipGroup.svelte";
  import MultiSelect from "./MultiSelect.svelte";

  const formats = [
    {
      id: "ods",
      label: "ODS",
      description: "Excel-compatible dataset and supporting information",
      checked: true,
    },
    { id: "csv", label: "CSV", description: "Machine readable data" },
    {
      id: "csvw",
      label: "CSVW",
      description: "Machine readable supporting information",
    },
    {
      id: "json",
      label: "JSON-Stat",
      description: "Machine readable data and supporting information",
    },
  ];

  let { data } = $props();

  let selectedTopics = $state(
    data.topic[0] === "all" ? data.topics.map((t) => t.slug) : data.topic
  );
  let selectAllTopics = $derived(selectedTopics.length === data.topics.length);
  let selectedIndicators = $state(
    data.taxonomy.filter((item) => data.indicator.includes(item.slug))
  );
  let selectedGeoLevels = $state(
    data.geoLevel[0] === "all"
      ? data.geoLevels.map((level) => level.key)
      : data.geoLevel
  );
  let selectAllGeoLevels = $derived(
    selectedGeoLevels.length === data.geoLevels.length
  );
  let selectedGeos = $state(
    data.areaList.filter((area) => data.geo.includes(area.areacd))
  );
  let selectedTimePeriod = $state([data.time[0], data.time[1]]);
  let selectAllYears = $state(false);
  let selectedMeasures = $state(
    data.measure[0] === "all"
      ? data.measures.map((m) => m.key)
      : data.measure
  );
  let selectAllMeasures = $derived(
    selectedMeasures.length === data.measures.length
  );
  let selectedFormat = $state(formats[0]);

  function toggleAllTopics() {
    if (selectAllTopics) selectedTopics = data.topics.map((t) => t.slug);
    else selectedTopics = [];
  }
  function toggleAllGeoLevels() {
    if (selectAllGeoLevels)
      selectedGeoLevels = data.geoLevels.map((g) => g.key);
    else selectedGeoLevels = [];
  }
  function toggleAllMeasures() {
    if (selectAllMeasures) selectedMeasures = data.measures.map((m) => m.key);
    else selectedMeasures = [];
  }

  function makeNextPath(
    topics,
    indicators,
    geos,
    geoLevels,
    times,
    allTimes,
    measures,
    step
  ) {
    let parts = [];
    const joinParts = () => `?${parts.join("&")}`;

    const topic =
      topics.length === data.topics.length ? "all" : topics.join(",");
    if (topic) parts.push(`topic=${topic}`);
    const indicator =
      indicators.length === data.taxonomy.length
        ? "all"
        : indicators.map((ind) => ind.slug).join(",");
    if (indicator) parts.push(`indicator=${indicator}`);
    if (step === 1) return joinParts();

    const geo = geos.map((geo) => geo.areacd).join(",");
    if (geo) parts.push(`geo=${geo}`);
    const geoLevel =
      geoLevels.length === data.geoLevels.length ? "all" : geoLevels.join(",");
    if (geoLevel) parts.push(`geoLevel=${geoLevel}`);
    if (step === 2) return joinParts();

    const time = allTimes ? "all" : times.filter((time) => time).join(",");
    if (time) parts.push(`time=${time}`);
    if (step === 3) return joinParts();

    const measure =
      measures.length === data.measures.length ? "all" : measures.join(",");
    if (measure) parts.push(`measure=${measure}`);
    return joinParts();
  }

  let nextPath = $derived.by(() =>
    makeNextPath(
      selectedTopics,
      selectedIndicators,
      selectedGeos,
      selectedGeoLevels,
      selectedTimePeriod,
      selectAllYears,
      selectedMeasures,
      data.step
    )
  );

  function makeDataUrl(
    topics,
    indicators,
    geos,
    geoLevels,
    times,
    allTimes,
    measures,
    format
  ) {
    let parts = [];
    const joinParts = () => page.url.origin + `/api/v1/data.${format.id}?includeNames=true&${parts.join("&")}`;

    const topic =
      topics.length === data.topics.length ? null : topics.join(",");
    if (topic) parts.push(`topic=${topic}`);
    const indicator =
      indicators.length === data.taxonomy.length
        ? null
        : indicators.map((ind) => ind.slug).join(",");
    if (indicator) parts.push(`indicator=${indicator}`);
    const geo = geos.map((geo) => geo.areacd).join(",");
    const geoLevel =
      geoLevels.length === data.geoLevels.length ? null : geoLevels.join(",");
    if (geo || geoLevel) parts.push(`geo=${[geo, geoLevel].filter(g => g).flat().join(",")}`);
    const time = allTimes ? "all" : times.filter((time) => time).join(",");
    if (time) parts.push(`time=${time}`);
    const measure =
      measures.length === data.measures.length ? null : measures.join(",");
    if (measure) parts.push(`measure=${measure}`);
    return joinParts();
  }

  let dataUrl = $derived.by(() =>
    makeDataUrl(
      selectedTopics,
      selectedIndicators,
      selectedGeos,
      selectedGeoLevels,
      selectedTimePeriod,
      selectAllYears,
      selectedMeasures,
      selectedFormat
    )
  );
</script>

<PhaseBanner phase="prototype" />
<Header compact title="Query builder" />
<Breadcrumb
  links={[{ label: "ELS API experiments", href: `${resolve("/")}` }]}
/>

<Section marginBottom={false}>
  <p style:margin="12px 0 32px">
    Construct a query by indicator, geography and time period, then download the data in your preferred format.
  </p>
</Section>

<Section width="medium">
  <Details title="Step 1. Topics and indicators" open={data.step === 1}>
    <ChipGroup
      label="Select topics"
      idKey="slug"
      items={data.topics}
      bind:value={selectedTopics}
    />
    <Checkbox
      label="Select all topics"
      bind:checked={selectAllTopics}
      compact
      on:change={toggleAllTopics}
    />
    <MultiSelect
      id="select-indicators"
      label="Select indicators"
      items={data.taxonomy}
      idKey="slug"
      labelKey="label"
      bind:selected={selectedIndicators}
    />
    <Button href="{nextPath}&step={data.step === 1 ? 2 : data.step }" small
      noScroll>{data.step === 1 ? "Next step" : "Update selection"}</Button
    >
  </Details>
  {#if data.step > 1}
    <Details title="Step 2. Geographic areas" open={data.step === 2}>
      <ChipGroup
        label="Select geography levels"
        idKey="key"
        items={data.geoLevels}
        bind:value={selectedGeoLevels}
      />
      <Checkbox
        label="Select all levels"
        bind:checked={selectAllGeoLevels}
        compact
        on:change={toggleAllGeoLevels}
      />
      <MultiSelect
        id="select-areas"
        label="Select individual areas"
        items={data.areaList}
        idKey="areacd"
        labelKey="areanm"
        bind:selected={selectedGeos}
      />
      <Button href="{nextPath}&step={data.step === 2 ? 3 : data.step }" small
        noScroll>{data.step === 2 ? "Next step" : "Update selection"}</Button
      >
    </Details>
  {/if}
  {#if data.step > 2}
    <Details title="Step 3. Time period" open={data.step === 3}>
      <div class="select-year-container">
        <Dropdown
          label="Start year"
          placeholder="Select year"
          options={data.years}
          bind:value={selectedTimePeriod[0]}
        />
        <Dropdown
          label="End year"
          placeholder="Select year"
          options={data.years}
          bind:value={selectedTimePeriod[1]}
        />
      </div>
      <Checkbox
        label="All years available"
        bind:checked={selectAllYears}
        compact
      />
      <Button href="{nextPath}&step={data.step === 3 ? 4 : data.step }" small
        noScroll>{data.step === 3 ? "Next step" : "Update selection"}</Button
      >
    </Details>
  {/if}
  {#if data.step > 3}
    <Details title="Step 4. Measures" open={data.step === 4}>
      <ChipGroup
        label="Select measures"
        idKey="key"
        items={data.measures}
        bind:value={selectedMeasures}
      />
      <Checkbox
        label="Select all measures"
        bind:checked={selectAllMeasures}
        compact
        on:change={toggleAllMeasures}
      />
      <Button href="{nextPath}&step={data.step === 4 ? 5 : data.step }" small
        noScroll>{data.step === 4 ? "Next step" : "Update selection"}</Button
      >
    </Details>
  {/if}
  {#if data.step > 4}
    <Details title="Step 5. Get the data" open={data.step === 5}>
      <Radios items={formats} bind:value={selectedFormat} compact />
      <Input label="Permalink" value={dataUrl}/>
      <Button icon="download" href={dataUrl} download="data.{selectedFormat.id}" small>Download data</Button>
      <Button variant="secondary" small>Copy permalink</Button>
    </Details>
  {/if}
</Section>

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
  :global(.ons-details) {
    padding: 1em 0;
    border-top: 1px solid grey;
  }
  :global(.ons-details) {
    padding: 1em 0;
    border-top: 1px solid grey;
  }
  :global(.ons-checkboxes__item){
    margin: 0.5em 0 1em;
  }
  :global(.ons-btn){
    margin: 0.5em 0 1em;
  }
  .select-year-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .select-year-container :global(.ons-field) {
    margin: 0;
  }
  .select-year-container :global(.ons-input) {
    width: 140px;
  }
</style>
