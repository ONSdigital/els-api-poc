<script lang="ts">
  import { resolve } from "$app/paths";
  import { Observe } from "@onsvisual/svelte-components";
  import {
    makeDataUrl,
    makeValueFormatter,
    makePeriodFormatter,
  } from "$lib/utils";
  import Beeswarm from "$lib/components/charts/BeeswarmNew.svelte";
  import Sparkline from "$lib/components/charts/Sparkline.svelte";

  let {
    indicator,
    metadata,
    timeRange,
    selected = [],
    geoGroup,
    hovered = $bindable(),
  } = $props();

  let visible = $state();
  let formatValue = $derived(makeValueFormatter(metadata.decimalPlaces));
  let formatPeriod = $derived(makePeriodFormatter(metadata.periodFormat));

  let loadedBeeswarmUrl = $state();
  let beeswarmData = $state();

  let loadedSparklineUrl = $state();
  let sparklineData = $state();

  async function fetchData(
    indicator,
    timeRange,
    selected,
    geoLevel,
    geoExtent,
    geoCluster,
    visible,
  ) {
    if (!visible) return;
    const beeswarmUrl = makeDataUrl(
      indicator,
      timeRange[1],
      "latest",
      selected,
      geoLevel,
      geoExtent,
      geoCluster,
    );
    if (beeswarmUrl !== loadedBeeswarmUrl) {
      try {
        beeswarmData = await (await fetch(beeswarmUrl)).json();
      } catch {
        console.log("Failed to load beeswarm data");
      }
      loadedBeeswarmUrl = beeswarmUrl;
    }
    const sparklineUrl = makeDataUrl(indicator, timeRange, null, selected);
    if (sparklineUrl !== loadedSparklineUrl) {
      try {
        sparklineData = await (await fetch(sparklineUrl)).json();
      } catch {
        console.log("Failed to load sparkline data");
      }
      loadedSparklineUrl = sparklineUrl;
    }
  }
  $effect(async () => {
    console.log(`Refreshing ${indicator} data`);
    fetchData(
      indicator,
      timeRange,
      selected,
      geoGroup.geoLevel,
      geoGroup.geoExtent,
      geoGroup.geoCluster,
      visible,
    );
  });
</script>

<Observe bind:visible rootMargin={200}>
  <details class="indicator-header">
    <summary class="indicator-title"
      ><strong>{metadata.label}</strong>{metadata.subText
        ? `, ${metadata.subText}`
        : ""}</summary
    >
    <div class="indicator-description">
      <p><strong>Definition:</strong> {metadata.description}</p>
      <p>
        <strong>Data source:</strong>
        {#each metadata.source as s}
          <a href={s.href} target="_blank">{s.name}</a>
        {/each}
      </p>
      <p>
        <strong>Published on:</strong>
        {metadata.source
          .map((s) => s.date.split("-").reverse().join("/"))
          .join(", ")}
      </p>
      <p>
        For more data and charts, visit our page on <a
          href={resolve(`/app/indicators/${metadata.slug}`)}>{metadata.label}</a
        >.
      </p>
    </div>
  </details>
  <div id={indicator} class="indicator-row">
    <div class="indicator-beeswarm">
      <Beeswarm
        data={beeswarmData || { message: "No data" }}
        {formatValue}
        {formatPeriod}
        {visible}
        {selected}
        bind:hovered
      />
    </div>
    <div class="indicator-sparkline">
      <Sparkline
        data={sparklineData || { message: "No data" }}
        {formatPeriod}
        {formatValue}
        {selected}
      />
    </div>
  </div>
</Observe>

<style>
  .indicator-row {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    width: 100%;
    height: 150px;
  }
  .indicator-beeswarm {
    flex-grow: 1;
    max-width: 470px;
  }
  .indicator-sparkline {
    flex-shrink: 1;
    width: 200px;
  }
  .indicator-row :global(svg) {
    overflow: visible;
  }
  .indicator-title {
    cursor: pointer;
    list-style-type: none;
  }
  .indicator-title::after {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    content: "i";
    width: 20px;
    height: 20px;
    margin-left: 6px;
    font-weight: bold;
    font-size: 14px;
    color: var(--ons-color-text-link);
    border: 2px solid currentColor;
    border-radius: 50%;
  }
  .indicator-title:focus::after,
  .indicator-title:hover::after {
    transform: scale(1.2);
    color: var(--ons-color-text-hover);
  }
  .indicator-description {
    margin: 10px 5px 20px;
    padding: 10px;
    background-color: var(--ons-color-banner-bg);
    border-left: solid;
    border-left-color: var(--ons-color-borders);
    border-left-width: 4px;
    line-height: 20px;
  }
  .indicator-description > p {
    font-size: 16px;
    margin: 0;
  }
  .indicator-description > p + p {
    margin-top: 1rem;
  }
</style>
