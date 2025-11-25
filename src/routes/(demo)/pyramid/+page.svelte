<script>
  import {
    Header,
    Section,
    Footer,
    Select,
    Button,
  } from "@onsvisual/svelte-components";
  import { fetchChartDataV1 } from "$lib/utils";
  import Pyramid from "./Pyramid.svelte";
  import BarcodeJoined from "./BarcodeJoined.svelte";

  let { data } = $props();

  let activeItem = $state();
  let selected = $state(["E06000001"]);
  console.log({ activeItem });
  $inspect(selected);

  function selectItem(e) {
    e.preventDefault();

    if (!selected.find((item) => item === activeItem))
      selected.push(activeItem.areacd);
  }

  function removeItem(item) {
    selected = selected.filter((i) => i !== item);
  }
</script>

<Header title="Population pyramid" compact={true} />

<main id="main">
  <Section>
    <p style:margin="12px 0 32px">
      Select an area to highlight on the population pyramid. (NB Scotland and
      Northern Ireland population data not yet available.)
    </p>
    <form class="select-container" on:submit={selectItem}>
      <Select
        options={data.areaList2023}
        bind:value={activeItem}
        labelKey="areanm"
        label="Select a local authority"
        placeholder="Eg. Fareham or Newport"
      />
      <Button small type="submit">Select area</Button>
    </form>

    {#each selected as s}
      <Button small="true" variant="secondary" on:click={() => removeItem(s)}>
        {s} X
      </Button>
    {/each}
  </Section>

  <Section
    title="Population by age and sex: barcode joined lines"
    marginTop={true}
    width="medium"
  >
    {#await fetchChartDataV1( "population-by-age-and-sex", { time: "2023", sex: ["female", "male"] } )}
      Fetching chart data
    {:then chartData}
      <BarcodeJoined
        data={chartData.filter((d) => d.value != null)}
        bind:selectedArea={selected}
      />
    {:catch}
      Failed to load chart data
    {/await}
  </Section>

  <Section
    title="Population by age and sex: traditional pop pyramid"
    marginTop={true}
    width="medium"
  >
    {#await fetchChartDataV1( "population-by-age-and-sex", { time: "2023", sex: ["female", "male"] } )}
      Fetching chart data
    {:then chartData}
      <Pyramid
        data={chartData.filter((d) => d.value != null)}
        bind:selectedArea={selected}
      />
    {:catch}
      Failed to load chart data
    {/await}
  </Section>
</main>

<Footer compact={true} />
