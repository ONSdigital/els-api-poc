<script>
  import { base } from "$app/paths";
  import { setContext } from "svelte";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Footer
  } from "@onsvisual/svelte-components";
  import AreasModal from "$lib/components/modals/AreasModal.svelte";
  import OptionsModal from "$lib/components/modals/OptionsModal.svelte";
  import { makePeriodFormatter } from "$lib/utils.js";

  let { data } = $props();

  let formatPeriod = $derived(makePeriodFormatter(data.metadata.periodFormat));

  let pageState = $state({
    selectedAreas: [],
    selectedGeoLevel: data.geoLevels.find(g => g.id === data.metadata.geography.initialLevel),
    selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
    showConfidenceIntervals: false,
    formatPeriod: () => formatPeriod
  });
  setContext("pageState", pageState);
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Selection modals" />
<Breadcrumb links={[{label: "ELS API experiments", href: `${base}/`}]}/>

<Section>
  <div>
    <AreasModal/>
    <OptionsModal/>
  </div>
</Section>

<Section>
  <p>
    Geography level:
    <strong>{pageState.selectedGeoLevel.label}</strong>
  </p>
  <p>
    Selected areas:
     <strong>{pageState.selectedAreas.map(d => d.areanm).join(", ")}</strong>
  </p>
  <p>
    Date range:
     <strong>{formatPeriod(pageState.selectedPeriodRange[0])} to {formatPeriod(pageState.selectedPeriodRange[1])}</strong>
  </p>
  <p>
    Show confidence intervals:
     <strong>{pageState.showConfidenceIntervals ? "Yes" : "No"}</strong>
  </p>
</Section>

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
</style>