<script lang="ts">
  import { resolve } from "$app/paths";
  import { setContext } from "svelte";
  import {
    analyticsEvent,
    Hero,
    Grid,
    GridCell,
    Button,
    Select,
    Card,
    PhaseBanner,
    Header,
    Breadcrumb,
    Section
  } from "@onsvisual/svelte-components";
  import BigNumber from "./BigNumber.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";

  let { data } = $props();

  $inspect(data.metadata);

  let pageState = $state({
    selectedAreas: [data.area.properties.areacd],
    selectedGeoLevel: data.area.properties.groupcd,
    selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
    showConfidenceIntervals: false
  });
  setContext("pageState", pageState);
</script>

<Hero title="Local indicators for {data.area.properties.areanm}"/>

<Section>
  <OptionsModal/>
</Section>

<Grid>
  {#each ["population-count", "five-year-population-change", "median-age"].filter((slug) => slug in data.metadata) as slug}
    <BigNumber indicator={data.metadata[slug]} geography={data.area.properties.areacd} period={pageState.selectedPeriodRange[1]}/>
  {/each}
</Grid>
