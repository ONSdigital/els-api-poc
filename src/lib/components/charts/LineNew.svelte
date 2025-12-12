<script lang="ts">
  import { scaleLinear, scaleTime } from "d3-scale";
  import { ticks } from "d3-array";
  import { parseChartData, markerPaths, contrastColor } from "./chartHelpers";
  import { ONSpalette } from "$lib/config";

  let {
    data,
    xKey = "period",
    yKey = "value",
    idKey = "areacd",
    labelKey = "areanm",
    formatValue = (d) => d,
    formatPeriod = (d) => d,
    selected = [],
    hoveredArea = null,
  } = $props();

  const height = 300;
  let width = $state();

  let _data = $derived(parseChartData(data, yKey, xKey, idKey));
  let _selected = $derived(
    _data ? selected.map((cd) => _data.keyed[cd]).filter((d) => d) : []
  );

  let xScale = $derived(
    _data ? scaleTime().domain(_data.dateDomain).range([0, width]) : null
  );
  let yScale = $derived(
    _data ? scaleLinear().domain(_data.valueDomain).range([height, 0]) : null
  );

  let linesCount = $derived(Object.values(_data.keyed).length);
  let lineOpacity = $derived(
    linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2
  );
  let lineStroke = $derived(
    linesCount < 30 ? "2px" : linesCount < 100 ? "1.75px" : "1.5px"
  );

  let yTickWidth = $state({});

  // let xTicks = $derived.by(() => {
  //   if (!xScale) return [];
  //   const initialTicks = xScale.ticks(5);
  //   const tickDiff =
  //     _data.dateDomain[1] - initialTicks[initialTicks.length - 1];
  //   return initialTicks.map((d) => new Date(+d + tickDiff));
  // });

  let xDistance = $derived(Math.abs(_data.dateDomain[1] - _data.dateDomain[0]));

  $inspect(xDistance);

  let xTicks = $derived.by(() => {
    if (!_data || !xScale) return [];

    const ticks = [];
    const anchorMonth = _data.dateDomain[0].getMonth();

    let year = _data.dateDomain[0].getFullYear();
    let firstMonth = new Date(year, anchorMonth, 1);
    if (firstMonth < _data.dateDomain[0]) {
      year += 1;
      firstMonth = new Date(year, anchorMonth, 1);
    }

    const step = 4;

    for (
      let d = firstMonth;
      d <= _data.dateDomain[1];
      d = new Date(d.getFullYear() + step, anchorMonth, 1)
    ) {
      ticks.push(d);
    }

    return ticks;
  });

  $inspect(_selected);
  $inspect(_data.keyed);
</script>

{#snippet line(arr, width = 1, color = "#b0b0b0", opacity = 1, id = "")}
  <polyline
    points={arr
      .map((d) => [xScale(d.date), yScale(d[yKey])].join(","))
      .join(" ")}
    stroke={color}
    stroke-width={width}
    {opacity}
    on:pointerenter={() => {
      hoveredArea = id;
    }}
    on:pointerleave={() => {
      hoveredArea = null;
    }}
  />
{/snippet}

<ul class="selected-labels">
  {#if _selected.length && !hoveredArea}
    {#each _selected as a, i}
      <li
        class="label"
        style="background:{ONSpalette[
          i
        ]}; color:white; font-size:18px; font-weight:bold"
      >
        {a[0]?.areanm}
      </li>
    {/each}
  {/if}

  {#if hoveredArea}
    <li
      class="label"
      style="background:#f39431; color:white; font-size:18px; font-weight:bold"
    >
      {_data.keyed[hoveredArea]?.[0]?.areanm}
    </li>
  {/if}
</ul>

<div
  class="line-wrapper"
  style:padding-left="{(yTickWidth[1] ?? 40) + 10}px"
  style:padding-top="0px"
  style:padding-bottom="25px"
  style:padding-right="50px"
>
  <div class="line-inner" bind:clientWidth={width}>
    <svg
      viewBox="0 0 {width} {height}"
      class="line-chart"
      preserveAspectRatio="none"
    >
      <g class="y-axis-container">
        <line
          x1="0"
          x2="0"
          y1={yScale(_data.valueDomain[0])}
          y2={yScale(_data.valueDomain[1])}
          stroke={"black"}
          stroke-width={1}
        ></line>
      </g>
      <g class="x-axis-container">
        <line
          y1={yScale(_data.valueDomain[0])}
          y2={yScale(_data.valueDomain[0])}
          x1={xScale(_data.dateDomain[0])}
          x2={xScale(_data.dateDomain[1])}
          stroke={"black"}
          stroke-width={1}
        ></line>
      </g>
      {#if _data && xScale && yScale}
        <g>
          {#each Object.values(_data.keyed) as arr, i}
            {@render line(
              arr,
              lineStroke,
              "#b0b0b0",
              lineOpacity,
              arr[0][idKey]
            )}
          {/each}

          {#if !hoveredArea}
            {#each _selected as arr, i}
              {@render line(arr, 3, ONSpalette[i], 1, arr[0][idKey])}
            {/each}
            {#each Object.values(_selected) as c, i}
              <circle
                cx={xScale(c.date)}
                cy={yScale(c[yKey])}
                r="5"
                fill={ONSpalette[i]}
                stroke="white"
              ></circle>
            {/each}
          {/if}

          {#if hoveredArea}
            {@render line(
              _data.keyed[hoveredArea],
              "4px",
              "orange",
              1,
              hoveredArea
            )}
            {#each _data.keyed[hoveredArea] as c}
              <circle
                cx={xScale(c.date)}
                cy={yScale(c[yKey])}
                r="5"
                fill="orange"
                stroke="white"
              ></circle>
            {/each}
          {/if}
        </g>
      {/if}
    </svg>
    <div class="line-x-axis">
      {#each xTicks as xTick}
        <div class="line-x-tick" style:left="{xScale(xTick)}px"></div>
        <div class="line-x-tick-label" style:left="{xScale(xTick)}px">
          {formatPeriod(xTick.toISOString())}
        </div>
      {/each}
    </div>
    <div class="line-x-axis">
      {#each _data.valueDomain as yTick, i}
        <div class="line-y-tick" style:top="{yScale(yTick)}%"></div>
        <div class="line-y-tick-label" style:top="{yScale(yTick)}%">
          <!-- bind:clientWidth={yTickWidth[i]}
        > -->
          {formatValue(yTick)}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .line-wrapper {
    display: block;
    position: relative;
  }
  .line-inner {
    display: block;
    position: relative;
  }
  .line-chart {
    width: 100%;
    margin-top: 30px;
    height: 300px;
    overflow: visible;
    display: block;
  }
  .line-chart polyline,
  .line-chart line {
    vector-effect: non-scaling-stroke;
    fill: none;
  }

  .line-chart circle {
    vector-effect: non-scaling-stroke;
    vector-effect: non-scaling-size;
  }

  .selected-labels {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
    min-height: 40px;
  }
  .label {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin: 0.2rem;
  }

  .line-x-axis,
  .line-y-axis {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    pointer-events: none;
  }

  .line-x-tick {
    position: absolute;
    top: 100%;
    height: 10px;
    border-left: 1px solid grey;
  }

  .line-x-tick-label {
    position: absolute;
    top: calc(100% + 10px);
    transform: translateX(-50%);
    font-size: 14px;
    white-space: nowrap;
  }
</style>
