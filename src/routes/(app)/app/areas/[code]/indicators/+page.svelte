<script lang="ts">
  import { resolve } from "$app/paths";
  import { setContext } from "svelte";
  import {
    Hero,
    Grid,
    Details,
    NavSections,
    NavSection,
    Dropdown,
  } from "@onsvisual/svelte-components";
  import { getName, formatName } from "@onsvisual/robo-utils";
  import BigNumber from "./BigNumber.svelte";
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import IndicatorRow from "./IndicatorRow.svelte";
  import AreasLegend from "$lib/components/modals/AreasLegend.svelte";

  let { data } = $props();

  let areaProps = $derived(data.area.properties);

  let defaultComparisonArea = data.areas.find(
    (a) => a.areacd === data.parent.areacd,
  );

  let pageState = $state({
    selectedAreas: [defaultComparisonArea],
    selectedGeoGroup: data.geoGroups[0],
    selectedPeriodRange: [
      data.periods[0],
      data.periods[data.periods.length - 1],
    ],
    selectedCluster: data.related.similar[0],
    showConfidenceIntervals: false,
  });
  setContext("pageState", pageState);

  let hovered = $state();

  $inspect(data.geoGroups);
</script>

<Hero title="Local indicators for {getName(areaProps, 'the')}" />

<Grid>
  {#each ["population-count", "five-year-population-change", "median-age"].filter((slug) => slug in data.metadata) as slug}
    <BigNumber
      indicator={data.metadata[slug]}
      geography={areaProps.areacd}
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
      metadata={data.metadata[item.slug]}
      timeRange={pageState.selectedPeriodRange}
      selected={[
        areaProps.areacd,
        ...pageState.selectedAreas.map((a) => a.areacd),
      ]}
      geoGroup={pageState.selectedGeoGroup}
      bind:hovered
    />
  {/if}
{/snippet}

<NavSections cls="wider-nav-sections">
  {#snippet before()}
    <div class="modals-sticky">
      <AreasLegend
        selectedAreas={[areaProps, ...pageState.selectedAreas]}
        selectedGeoGroup={pageState.selectedGeoGroup}
      />
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
  {#if data.related.similar[0]}
    <NavSection title="Similar areas">
      <p>
        See which areas are similar to {getName(areaProps, "the")} based on specific
        groups of indicators. These clusters of areas are based on an analysis carried
        out by the ONS.
      </p>
      <Dropdown
        label="Select a group of indicators"
        options={data.related.similar}
        bind:value={pageState.selectedCluster}
      />
      <Details
        title="Show the 20 most similar areas to {getName(areaProps, 'the')}"
      >
        <ol>
          {#each pageState.selectedCluster.similar as area}
            <li>{area.areanm}</li>
          {/each}
        </ol>
      </Details>
    </NavSection>
  {/if}
  <NavSection title="Get the data">
    <p>
      Download all datasets that include {getName(areaProps, "the")} in an
      <a
        href={resolve(
          `/api/v1/data.ods?hasGeo=${areaProps.areacd}&excludeMultivariate=true&time=all`,
        )}
        download="data.ods">ODS</a
      >
      <a
        href={resolve(
          `/api/v1/data.csv?hasGeo=${areaProps.areacd}&excludeMultivariate=true&time=all`,
        )}
        download="data.csv">CSV</a
      >,
      <a
        href={resolve(
          `/api/v1/data.csv?hasGeo=${areaProps.areacd}&excludeMultivariate=true&time=all`,
        )}
        download="data.csv-metadata.json">CSVW</a
      >, or
      <a
        href={resolve(
          `/api/v1/data.json?hasGeo=${areaProps.areacd}&excludeMultivariate=true&time=all`,
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
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--ons-color-page-light);
    padding: 0.5em 0;
  }
</style>
