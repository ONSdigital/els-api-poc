<script lang="ts">
  import { Card, Icon, Observe } from "@onsvisual/svelte-components";
  import { makePeriodFormatter, makeDataUrl } from "$lib/utils";

  let { indicator, geography, period } = $props();

  let visible = $state(false);
  let data = $state();
  let loadedDataUrl = $state();

  let formatPeriod = $derived(makePeriodFormatter(indicator.periodFormat));

  async function fetchData(period, visible) {
    if (!visible) return;

    const dataUrl = makeDataUrl(indicator.slug, period, "latest", [geography]);
    if (dataUrl !== loadedDataUrl) {
      try {
        data = await (await fetch(dataUrl)).json();
      } catch {
        console.log("Failed to load big number data");
      }
      loadedDataUrl = dataUrl;
    }
  }
  $effect(async () => {
    console.log(`Refreshing ${indicator.slug} big number data`);
    fetchData(period, visible);
  });
</script>

<Card
  title={indicator.label}
  id="{indicator.slug}-card"
  mode="featured"
>
  <Observe bind:visible>
    {#if data}
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
    {/if}
    <p class="ons-u-mb-no">
      <a href="#{indicator.slug}"><Icon type="arrow" rotation={90} /> View indicator</a>
    </p>
  </Observe>
</Card>