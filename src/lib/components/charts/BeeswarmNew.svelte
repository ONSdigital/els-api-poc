<script lang="ts">
  import { parseBeeswarmData, contrastColor } from "./chartHelpers";
  import { ONSpalette, markerPathsArray } from "$lib/config";

  let {
    data,
    xKey = "value",
    idKey = "areacd",
    labelKey = "areanm",
    periodKey = "period",
    formatValue = (d) => d,
    formatPeriod = (d) => d,
    selected = [],
    hovered = $bindable(),
  } = $props();

  let _data = $derived(parseBeeswarmData(data, xKey, idKey));
  let _selected = $derived(
    _data
      ? selected
          .map((cd, i) => ({ i, datum: _data.keyed[cd] }))
          .filter((d) => d.datum)
      : [],
  );
  let _hovered = $derived(_data ? _data.keyed[hovered] : null);
  let comparison = $derived.by(() => {
    const val1 = _data?.keyed?.[selected[0]]?.[xKey];
    const val2 = _data?.keyed?.[selected[1]]?.[xKey];
    if (!val1 || !val2) return null;
    const diff = val1 - val2;
    console.log(diff, _data.mad);
    return diff > _data.mad
      ? "Higher than"
      : diff < -_data.mad
        ? "Lower than"
        : "Similar to";
  });
</script>

{#snippet point(d, radius = 8, color)}
  <g
    class="beeswarm-point"
    transform="translate({d.x} {100 - d.y})"
    opacity={color ? 1 : 0.9}
  >
    <polyline points="0,0 0,0" stroke="white" stroke-width={radius + 2} />
    <polyline points="0,0 0,0" stroke={color || "#aaa"} stroke-width={radius} />
    <polyline
      points="0,0 0,0"
      stroke={color || "#ddd"}
      stroke-width={radius - 2}
      onmouseenter={() => (hovered = d[idKey])}
    />
  </g>
{/snippet}

{#snippet line(d, color)}
  <polyline
    points="0,0 0,{100 - d.y}"
    stroke={color}
    stroke-width="2"
    transform="translate({d.x},0)"
  />
{/snippet}

{#snippet marker(d, path, color)}
  <svg viewBox="-4 -4 8 8" class="beeswarm-marker" style:left="{d.x}%">
    <path d={path} fill={color} vector-effect="non-scaling-stroke" />
  </svg>
{/snippet}

{#snippet label(d, color, showName = false)}
  <div
    class="beeswarm-label"
    style:background={color}
    style:color={contrastColor(color)}
    style:left="{d.x}%"
  >
    {showName
      ? `${d[labelKey]}, ${formatValue(d[xKey])}`
      : formatValue(d[xKey])}
  </div>
{/snippet}

<div class="beeswarm-wrapper">
  <div class="beeswarm-container">
    <svg
      viewBox="0 0 100 100"
      class="beeswarm-chart"
      preserveAspectRatio="none"
    >
      {#if _data}
        <g class="beeswarm-points" onmouseleave={() => (hovered = null)}>
          {#each _data.array as d (d[idKey])}
            {@render point(d)}
          {/each}
        </g>
        <g class="beeswarm-selected">
          {#each _selected as sel}
            {@const d = { ...sel.datum, y: 0 }}
            {#if !hovered}
              {@render line(d, ONSpalette[sel.i])}
            {/if}
          {/each}
        </g>
        <g class="beeswarm-hovered">
          {#if _hovered}
            {@const d = _hovered}
            {@render line(d, "orange")}
            {@render point(d, 14, "orange")}
          {/if}
        </g>
      {/if}
    </svg>
    <div class="beeswarm-annotations">
      {#if _data}
        {#if _hovered}
          {@render label(_hovered, "orange", true)}
        {:else}
          {#each _selected as d}
            {@render label(d.datum, ONSpalette[d.i], false)}
            {@render marker(d.datum, markerPathsArray[d.i], ONSpalette[d.i])}
          {/each}
        {/if}
      {/if}
    </div>
  </div>
  <p class="beeswarm-comparison ons-u-fs-s">
    {#if comparison}
      {comparison} <strong>{_data?.keyed?.[selected[1]]?.[labelKey]}</strong> in {formatPeriod(
        _data?.keyed?.[selected[1]]?.[periodKey],
      )}
    {:else}
      Data for comparison area not available
    {/if}
  </p>
</div>

<style>
  .beeswarm-wrapper {
    display: block;
    position: relative;
    margin: 30px 0 20px;
  }
  .beeswarm-container {
    display: block;
    position: relative;
    height: 100%;
    margin: 0;
  }
  .beeswarm-chart {
    display: block;
    width: 100%;
    height: 70px;
    overflow: visible;
  }
  .beeswarm-chart polyline {
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .beeswarm-selected,
  .beeswarm-hovered,
  .beeswarm-label {
    pointer-events: none;
  }
  .beeswarm-annotations {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  .beeswarm-label {
    position: absolute;
    bottom: calc(100% - 6px);
    transform: translateX(-50%);
    padding: 4px 6px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1.2;
  }
  .beeswarm-marker {
    position: absolute;
    bottom: 0;
    width: 20px;
    height: 20px;
    transform: translate(-50%, 50%);
  }
  .beeswarm-comparison {
    display: block;
    text-align: center;
    margin-top: 10px;
  }
</style>
