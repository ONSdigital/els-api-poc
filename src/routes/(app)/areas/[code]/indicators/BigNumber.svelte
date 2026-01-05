<script lang="ts">
  import { Card, Icon, Observe } from "@onsvisual/svelte-components";
  import { capitalise } from "@onsvisual/robo-utils";
  import {
    makePeriodFormatter,
    makeValueFormatter,
    makeDataUrl,
  } from "$lib/utils";

  let { indicator, metadata, geography, period } = $props();

  let visible = $state(false);
  let data = $state();
  let loadedDataUrl = $state();

  let formatPeriod = $derived(makePeriodFormatter(metadata.periodFormat));
  let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));

  async function fetchData(period, visible) {
    if (!visible) return;

    const dataUrl = makeDataUrl(metadata.slug, period, "latest", [geography]);
    if (dataUrl !== loadedDataUrl) {
      try {
        data = await (await fetch(dataUrl)).json();
      } catch {
        console.log("Failed to load big number data");
      }
      loadedDataUrl = dataUrl;
    }
  }
  $effect(() => {
    console.log(`Refreshing ${indicator} big number data`);
    fetchData(period, visible);
  });
</script>

<Card
  title={indicator === "five-year-population-change"
    ? "Population change"
    : metadata.label}
  id="{indicator}-card"
  mode="featured"
>
  <Observe bind:visible rootMargin={200}>
    <div class="big-number-contents ons-u-mb-xs">
      {#if data}
        <p class="ons-card__subtitle ons-u-mb-xs" style:margin-top="-12px">
          {formatPeriod(data.period[0])}
        </p>
        <p class="ons-card__figure ons-u-fs-3xl ons-u-fw-b ons-u-mb-no">
          {metadata.canBeNegative && data.value[0] > 0
            ? "+"
            : ""}{indicator.prefix}{formatValue(data.value[0])}{metadata.suffix}
        </p>
        <p class="ons-card__body ons-u-mb-xs">
          {indicator === "five-year-population-change"
            ? "Five year change"
            : capitalise(metadata.subText)}
        </p>
      {/if}
    </div>
    <p class="ons-u-mb-no">
      <a href="#{indicator}"
        ><Icon type="arrow" rotation={90} /> View indicator</a
      >
    </p>
  </Observe>
</Card>

<style>
  .big-number-contents {
    min-height: 112px;
  }
</style>
