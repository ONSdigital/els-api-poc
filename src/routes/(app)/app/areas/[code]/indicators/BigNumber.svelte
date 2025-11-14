<script lang="ts">
  import { resolve } from '$app/paths';
  import { Card, Icon } from "@onsvisual/svelte-components";
  import { makePeriodFormatter } from "$lib/utils.js";

  let { indicator, geography, period } = $props();

  let formatPeriod = $derived(makePeriodFormatter(indicator.periodFormat));

  async function fetchData(period) {
    const url = resolve(`/api/v1/data.cols.json?indicator=${indicator.slug}&geo=${geography}&time=${period}&timeNearest=latest&measure=value`);
    return await (await fetch(url)).json();
  }
</script>

<Card
	title={indicator.label}
	id="{indicator.slug}-card"
	mode="featured"
>
  {#await fetchData(period)}
    Loading data...
  {:then data}
    <p class="ons-card__subtitle ons-u-mb-xs" style:margin-top="-12px">{formatPeriod(data.period[0])}</p>
    <p class="ons-card__figure ons-u-fs-3xl ons-u-fw-b ons-u-mb-no">
      {indicator.canBeNegative && data.value[0] > 0
        ? '+'
        : ''}{indicator.prefix}{data.value[0].toLocaleString('en-GB', {
        minimumFractionDigits: indicator.decimalPlaces,
        maximumFractionDigits: indicator.decimalPlaces
      })}{indicator.suffix}
    </p>
    <p class="ons-card__body ons-u-mb-xs">
      {indicator.unit}
    </p>
  {:catch}
    Failed to load data!
  {/await}
	<p class="ons-u-mb-no">
		<a href="#{indicator.slug}"><Icon type="arrow" rotation={90} /> View indicator</a>
	</p>
</Card>