<script lang="ts">
  import { resolve } from "$app/paths";
  import { setContext } from "svelte";
  import {
    Hero,
    Grid,
    Section,
    NavSections,
    NavSection,
  } from "@onsvisual/svelte-components";
  import BigNumber from "./BigNumber.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";

  let { data } = $props();

  $inspect(data.metadata);

  let pageState = $state({
    selectedAreas: [data.area.properties.areacd],
    selectedGeoLevel: data.area.properties.groupcd,
    selectedPeriodRange: [
      data.periods[0],
      data.periods[data.periods.length - 1],
    ],
    showConfidenceIntervals: false,
  });
  setContext("pageState", pageState);
</script>

<Hero title="Local indicators for {data.area.properties.areanm}" />

<Section>
  <div><OptionsModal /></div>
</Section>

<Grid>
  {#each ["population-count", "five-year-population-change", "median-age"].filter((slug) => slug in data.metadata) as slug}
    <BigNumber
      indicator={data.metadata[slug]}
      geography={data.area.properties.areacd}
      period={pageState.selectedPeriodRange[1]}
    />
  {/each}
</Grid>

{#snippet indicator(item)}
  {#if item.children}
    <h4>{item.label}</h4>
    {#each item.children as child}
      {@render indicator(child)}
    {/each}
  {:else}
    <strong>{item.label}</strong>
    <p>Charts go here.</p>
  {/if}
{/snippet}

<NavSections>
  <NavSection title="Topics" />
  {#each data.taxonomy as topic}
    <NavSection title={topic.label} subsection>
      {#each topic.children as child}
        {@render indicator(child)}
      {/each}
    </NavSection>
  {/each}
  <NavSection title="Select an indicator" />
  <NavSection title="Get the data">
    <p>
      Download all datasets that include {data.area.properties.areanm} in a
      <a
        href={resolve(`/api/v1/data.csv?hasGeo=${data.area.properties.areacd}&time=all&excludeMultivariate=true`)}
        download="data.csv">CSV</a
      >,
      <a
        href={resolve(`/api/v1/data.ods?hasGeo=${data.area.properties.areacd}&time=all&excludeMultivariate=true`)}
        download="data.ods">ODS</a
      >
      or
      <a
        href={resolve(
          `/api/v1/data.json?hasGeo=${data.area.properties.areacd}&time=all&excludeMultivariate=true`
        )}
        download="data.json">JSON-Stat</a
      > format.
    </p>
    <p>
      Information on the strengths and limitations of the Explore Local
      Statistics (ELS) service and methods used is available in
      <a
        href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
        >ELS quality and methodology information (QMI) report</a
      >.
    </p>
    <p>
      We value your feedback on these statistics. If you would like to get in
      touch, please email <a href="mailto:explore.local.statistics@ons.gov.uk"
        >explore.local.statistics@ons.gov.uk</a
      >.
    </p>
  </NavSection>
</NavSections>
