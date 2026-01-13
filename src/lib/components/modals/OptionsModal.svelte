<script lang="ts">
  import { Checkbox } from "@onsvisual/svelte-components";
  import Modal from "./Modal.svelte";
  import RangeSlider from "./RangeSlider.svelte";

  let { data, state = $bindable() } = $props();

  let formatTick = $derived(state?.formatPeriod?.() || ((d) => d));
</script>

<Modal title="Chart options" label="Chart options" icon="cog">
  <RangeSlider
    label="Selected time range"
    options={data.periods}
    {formatTick}
    bind:selectedRange={state.selectedPeriodRange}
  />
  <Checkbox
    id="ci-checkbox"
    bind:checked={state.showConfidenceIntervals}
    label="Show confidence intervals"
    compact
  />
</Modal>
