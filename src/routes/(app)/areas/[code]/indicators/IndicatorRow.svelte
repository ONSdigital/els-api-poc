<script lang="ts">
  import { resolve } from "$app/paths";
  import { Observe, Em } from "@onsvisual/svelte-components";
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
    hidden = null,
  } = $props();

  let visible = $state(false);
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
    console.log(`Refreshing ${indicator} data`);
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
    fetchData(
      indicator,
      timeRange,
      selected,
      geoGroup.geoLevel,
      geoGroup.geoExtent,
      geoGroup.geoCluster,
      visible && !hidden,
    );
  });
</script>

{#snippet downloadUrl(url, format, formatLabel = null)}
  {@const label = formatLabel || format.toUpperCase()}
  <a
    href={url?.replace(".cols.json", `.${format}`)}
    download="{indicator}.{format}">{label}</a
  >
{/snippet}

<Observe bind:visible rootMargin={200}>
  <div id={indicator} class="indicator-row" {hidden}>
    <details class="indicator-header">
      <summary class="indicator-title"
        ><strong>{metadata.label}</strong>{metadata.subText
          ? `, ${metadata.subText}`
          : ""}</summary
      >
      <div class="indicator-description">
        {#if metadata.experimentalStatistic}
          <p>
            <Em color="#003c57">Official statistics in development</Em>
          </p>
        {/if}
        <p><strong>Definition:</strong> {metadata.description}</p>
        <p>
          <strong
            >{metadata.source.length > 1
              ? "Data sources"
              : "Data source"}:</strong
          >
          {#each metadata.source as s, i}
            <a href={s.href} target="_blank">{s.name}</a>
            ({s.date.split("-").reverse().join("/")}){i ===
            metadata.source.length - 1
              ? ""
              : ", "}
          {/each}
        </p>
        <p><strong>Download data:</strong></p>
        <ul>
          <li>
            Beeswarm data as {@render downloadUrl(loadedBeeswarmUrl, "csv")},
            {@render downloadUrl(loadedBeeswarmUrl, "csvw")},
            {@render downloadUrl(loadedBeeswarmUrl, "ods")}, or
            {@render downloadUrl(loadedBeeswarmUrl, "json", "JSON-Stat")}.
          </li>
          <li>
            Line chart data as {@render downloadUrl(loadedSparklineUrl, "csv")},
            {@render downloadUrl(loadedSparklineUrl, "csvw")},
            {@render downloadUrl(loadedSparklineUrl, "ods")}, or
            {@render downloadUrl(loadedSparklineUrl, "json", "JSON-Stat")}.
          </li>
        </ul>
        <p>
          For more data and charts, visit our page on <a
            href={resolve(`/indicators/${metadata.slug}`)}>{metadata.label}</a
          >.
        </p>
      </div>
    </details>
    <div class="indicator-charts">
      <div class="indicator-beeswarm">
        <Beeswarm
          data={beeswarmData || { message: "No data" }}
          {formatPeriod}
          {formatValue}
          valuePrefix={metadata.prefix}
          valueSuffix={metadata.suffix}
          {selected}
          bind:hovered
        />
      </div>
      <div class="indicator-sparkline">
        <Sparkline
          data={sparklineData || { message: "No data" }}
          {formatPeriod}
          {formatValue}
          valuePrefix={metadata.prefix}
          valueSuffix={metadata.suffix}
          {selected}
        />
      </div>
    </div>
  </div>
</Observe>

<style>
  .indicator-charts {
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
  .indicator-description > p,
  .indicator-description > ul {
    font-size: 16px;
    margin: 0;
  }
  .indicator-description > p + p,
  .indicator-description > ul + p {
    margin-top: 1rem;
  }
  .indicator-description > p + ul {
    margin-top: 0.5em;
  }
  .indicator-header {
    scroll-margin-top: 116px;
  }
</style>
