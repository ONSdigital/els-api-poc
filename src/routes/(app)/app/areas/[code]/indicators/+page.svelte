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
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import IndicatorRow from "./IndicatorRow.svelte";

  let { data } = $props();

  let defaultComparisonArea = $derived(data.areas.find(a => a.areacd === data.parent.areacd));

  let pageState = $state({
    selectedAreas: [defaultComparisonArea],
    selectedGeoGroup: data.geoGroups[0],
    selectedPeriodRange: [
      data.periods[0],
      data.periods[data.periods.length - 1],
    ],
    showConfidenceIntervals: false,
  });
  setContext("pageState", pageState);

  let hovered = $state();
</script>

<Hero title="Local indicators for {data.area.properties.areanm}" />

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
    <IndicatorRow
      indicator={item.slug}
      timeRange={pageState.selectedPeriodRange}
      selected={[data.area.properties.areacd, ...pageState.selectedAreas.map(a => a.areacd)]}
      geoGroup={pageState.selectedGeoGroup}
      bind:hovered/>
  {/if}
{/snippet}

<NavSections>
  {#snippet before()}
		<div class="modals-sticky">
      <div>
        <AreasModal />
        <OptionsModal />
      </div>
    </div>
	{/snippet}
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

<style>
  .modals-sticky {
    z-index: 1;
    display: block;
    position: sticky;
    top: 0;
    background: var(--ons-color-page-light);
    padding: .5em 0;
  }
</style>