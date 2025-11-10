<script>
  import { page } from "$app/state";
  import { getContext } from "svelte";
  import { Checkbox } from "@onsvisual/svelte-components";
  import Modal from "./Modal.svelte";
  import RangeSlider from "./RangeSlider.svelte";

  let pageState = getContext("pageState");

  let formatTick = $derived(pageState.formatPeriod());
</script>

<Modal title="Chart options" label="Chart options">
  <RangeSlider
    label="Selected time range"
    options={page.data.periods}
    {formatTick}
    bind:selectedRange={pageState.selectedPeriodRange}/>
  <Checkbox bind:checked={pageState.showConfidenceIntervals} label="Show confidence intervals" compact/>
</Modal>
