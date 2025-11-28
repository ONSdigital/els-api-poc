<script lang="ts">
  import { parseBeeswarmData, contrastColor } from "./chartHelpers";
  import { ONSpalette } from "$lib/config";

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
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );
  let _hovered = $derived(_data ? _data.keyed[hovered] : null);
  let comparison = $derived.by(() => {
    const val1 = _data?.keyed?.[selected[0]]?.[xKey];
    const val2 = _data?.keyed?.[selected[1]]?.[xKey];
    if (!val1 || !val2) return null;
    const diff = val1 - val2;
    console.log(diff, _data.mad)
    return diff > _data.mad ? "Higher than" : diff < -_data.mad ? "Lower than" : "Similar to";
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

{#snippet label(d, color, showName = false)}
  <div
    class="beeswarm-label"
    style:background={color}
    style:color={contrastColor(color)}
    style:left="{d.x}%"
  >
    {showName ? `${d[labelKey]}, ${formatValue(d[xKey])}` : formatValue(d[xKey])}
  </div>
{/snippet}

<div class="beeswarm-wrapper">
  <svg viewBox="0 0 100 100" class="beeswarm-chart" preserveAspectRatio="none">
    {#if _data}
      <g class="beeswarm-points" onmouseleave={() => (hovered = null)}>
        {#each _data.array as d (d[idKey])}
          {@render point(d)}
        {/each}
      </g>
      <g class="beeswarm-selected">
        {#each _selected as sel, i}
          {@const d = { ...sel, y: 0 }}
          {@render point(d, 13, ONSpalette[i])}
          {#if !hovered}
            {@render line(d, ONSpalette[i])}
          {/if}
        {/each}
      </g>
      <g class="beeswarm-hovered">
        {#if _hovered}
          {@const d = _hovered}
          {@render point(d, 13, "orange")}
          {@render line(d, "orange")}
        {/if}
      </g>
    {/if}
  </svg>
  {#if _data}
    {#if _hovered}
      {@render label(_hovered, "orange", true)}
    {:else}
      {#each _selected as d, i}
        {@render label(d, ONSpalette[i], false)}
      {/each}
    {/if}
  {/if}
  <p class="beeswarm-comparison ons-u-fs-s">
  {#if comparison}
      {comparison} <strong>{_selected[1][labelKey]}</strong> in {formatPeriod(_selected[1][periodKey])}
    {:else}
      Data for comparison area not available
    {/if}
  </p>
</div>

<style>
  .beeswarm-wrapper {
    display: block;
    position: relative;
    margin-bottom: 20px;
  }
  .beeswarm-chart {
    width: 100%;
    height: 70px;
    margin-top: 30px;
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
  .beeswarm-label {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    padding: 4px 6px;
    border-radius: 4px;
    font-weight: bold;
    line-height: 1.2;
  }
  .beeswarm-comparison {
    display: block;
    text-align: center;
  }
</style>
