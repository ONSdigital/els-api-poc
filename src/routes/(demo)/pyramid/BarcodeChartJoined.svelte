<script lang="ts">
  import { scaleLinear, scaleBand } from "d3-scale";
  import { colours } from "$lib/config";

  export let barHeight = 35;
  export let gutter = 70;
  export let bottomMargin = 20;
  export let xKey = "value";
  export let yKey = "age";
  export let zKey = "sex";
  export let groupKey = "areacd";
  export let hoveredArea = null;
  export let selectedArea = [];
  export let hover = () => null;
  export let keyedData;
  export let data;

  let w = 400;

  $: xRangeMax = (w - gutter) / 2;
  $: xRange = [0, xRangeMax];
  $: xScale = scaleLinear().domain(xDomain).range(xRange);
  $: xTicks = [0, 4, 8];

  const xDomain = [0, Math.max(...data.map((d) => d[xKey]))];
  const yDomain = Array.from(new Set(data.map((d) => d[yKey])));
  const zDomain = ["Female", "Male"];
  const yMax = barHeight * yDomain.length;
  const barGap = 1; // actual size of barGap in pixels
  const barGapScale = (1 / barHeight) * barGap;
  const yRange = [yMax, 0];
  const yScale = scaleBand()
    .domain(yDomain)
    .range(yRange)
    .paddingInner(barGapScale);

  function sumBySex(area) {
    const filtered = keyedData[area] || [];
    return {
      Male: filtered
        .filter((d) => d.sex === "Male")
        .reduce((acc, d) => acc + d.value, 0),
      Female: filtered
        .filter((d) => d.sex === "Female")
        .reduce((acc, d) => acc + d.value, 0),
    };
  }

  $: sums = hoveredArea ? sumBySex(hoveredArea) : selectedArea.length === 1 ? sumBySex(selectedArea) :  null;

  function calculateFemalePoints(area, xScale) {
    const data = keyedData[area];
    return data
      .filter((d) => d[zKey] === zDomain[0])
      .flatMap((d) => [
        [
          xRangeMax - xScale(d[xKey]),
          yScale(d[yKey]) + yScale.bandwidth() + barGap / 2,
        ], // bottom left
        [xRangeMax - xScale(d[xKey]), yScale(d[yKey]) - barGap / 2], // top left
      ])
      .map((p) => p.join(","))
      .join(" ");
  }

  function calculateMalePoints(area, xScale) {
    const data = keyedData[area];
    return data
      .filter((d) => d[zKey] === zDomain[1])
      .flatMap((d) => [
        [
          xRangeMax + gutter + xScale(d[xKey]),
          yScale(d[yKey]) + yScale.bandwidth() + barGap / 2,
        ], // bottom right
        [xRangeMax + gutter + xScale(d[xKey]), yScale(d[yKey]) - barGap / 2], // top right
      ])
      .map((p) => p.join(","))
      .join(" ");
  }
</script>

<!-- snippets only work with svelte 5 -->
<!-- {#snippet line(d)}
	{#if d[zKey] === zDomain[0]}
		<line
			class="chart-line"
			x1={xRangeMax - xScale(d[xKey])}
			y1={yScale(d[yKey])}
			x2={xRangeMax - xScale(d[xKey])}
			y2={yScale(d[yKey]) + yScale.bandwidth()}
		/>
	{:else if d[zKey] === zDomain[1]}
		<line
			class="chart-line"
			x1={xScale(d[xKey]) + xRangeMax + gutter}
			y1={yScale(d[yKey])}
			x2={xScale(d[xKey]) + xRangeMax + gutter}
			y2={yScale(d[yKey]) + yScale.bandwidth()}
		/>
	{/if}
{/snippet} -->

<div class="chart-container" bind:clientWidth={w}>
  <svg class="chart" viewBox="0 0 {w} {yMax + bottomMargin}">
    {#if xRange && xScale}
      <g class="chart-label">
        <text x={w} y="20" text-anchor="end"> Males</text>
        <text x={0} y="20" text-anchor="start"> Females</text>
      </g>
      {#if sums}
        <g class="chart-pc">
          <text x={w} y="50" text-anchor="end">
            {Math.round(sums.Male * 10) / 10}%</text
          >
          <text x={0} y="50" text-anchor="start">
            {Math.round(sums.Female * 10) / 10}%</text
          >
        </g>
      {/if}
      <g class="chart-y-axis">
        {#each yDomain as yTick}
          <text
            class="chart-y-tick"
            x={w / 2}
            y={yScale(yTick) + yScale.bandwidth() / 2}
          >
            {yTick}
          </text>
        {/each}
        <line
          x1={xScale(0) + xRangeMax + gutter}
          y1={0}
          x2={xScale(0) + xRangeMax + gutter}
          y2={yMax}
          stroke="#b3b3b3"
          stroke-width="1.5px"
        />
        <line
          x1={xScale(0) + xRangeMax}
          y1={0}
          x2={xScale(0) + xRangeMax}
          y2={yMax}
          stroke="#b3b3b3"
          stroke-width="1.5px"
        />
      </g>
      <g class="chart-background">
        {#each Object.entries(keyedData) as areaData}
          <g
            class:chart-hovered={areaData[0] === hoveredArea}
            on:mouseenter={(e) => {
              hoveredArea = areaData[0];
              e.target.parentNode.appendChild(e.target);
              hover(hoveredArea);
            }}
            on:mouseleave={() => {
              hoveredArea = null;
              hover(hoveredArea);
            }}
          >
            {#each areaData[1] as d}
              {#if d[zKey] === zDomain[0]}
                <line
                  class="chart-line"
                  x1={xRangeMax - xScale(d[xKey])}
                  y1={yScale(d[yKey])}
                  x2={xRangeMax - xScale(d[xKey])}
                  y2={yScale(d[yKey]) + yScale.bandwidth()}
                />
              {:else if d[zKey] === zDomain[1]}
                <line
                  class="chart-line"
                  x1={xScale(d[xKey]) + xRangeMax + gutter}
                  y1={yScale(d[yKey])}
                  x2={xScale(d[xKey]) + xRangeMax + gutter}
                  y2={yScale(d[yKey]) + yScale.bandwidth()}
                />
              {/if}
            {/each}
          </g>
        {/each}
      </g>
      {#if hoveredArea}
        <g class="chart-hovered">
          <polyline
            class="chart-line"
            points={calculateFemalePoints(hoveredArea, xScale)}
            fill="none"
          />
          <polyline
            class="chart-line"
            points={calculateMalePoints(hoveredArea, xScale)}
            fill="none"
          />
        </g>
      {:else if selectedArea.length}
        <g class="chart-selected">
          {#each selectedArea.slice(1) as a, i}
          <polyline
                points={calculateFemalePoints(a, xScale)}
                fill="none"
                stroke='white'
                stroke-width={4}
              />
              <polyline
                points={calculateMalePoints(a, xScale)}
                fill="none"
                stroke="white"
                stroke-width={4}
              />
              <polyline
                points={calculateFemalePoints(a, xScale)}
                fill="none"
                stroke={colours[i + 1]}
                stroke-width={2}
              />
              <polyline
                points={calculateMalePoints(a, xScale)}
                fill="none"
                stroke={colours[i + 1]}
                stroke-width={2}
              />
          {/each}
          <polyline
              points={calculateFemalePoints(selectedArea[0], xScale)}
              fill="none"
              stroke="white"
              stroke-width={6}
            />
            <polyline
              points={calculateMalePoints(selectedArea[0], xScale)}
              fill="none"
              stroke="white"
              stroke-width={6}
            />
          <polyline
              points={calculateFemalePoints(selectedArea[0], xScale)}
              fill="none"
              stroke={colours[0]}
              stroke-width={3}
            />
            <polyline
              points={calculateMalePoints(selectedArea[0], xScale)}
              fill="none"
              stroke={colours[0]}
              stroke-width={3}
            />
        </g>
      {/if}
      <!-- add x axis  -->

      <g class="chart-x-axis" transform={`translate(0, ${yMax + 5})`}>
        {#each xTicks as tick}
          <!-- <line
			x1={xScale(tick) + xRangeMax + gutter}
			y1={0}
			x2={xScale(tick) + xRangeMax + gutter}
			y2={5}
			stroke="black"
		/> -->
          <text
            x={xScale(tick) + xRangeMax + gutter}
            y={20}
            text-anchor="middle"
            font-size="14"
          >
            {tick}%
          </text>

          <!-- <line
			x1={xRangeMax - xScale(tick)}
			y1={0}
			x2={xRangeMax - xScale(tick)}
			y2={5}
			stroke="black"
		/> -->
          <text
            x={xRangeMax - xScale(tick)}
            y={20}
            text-anchor="middle"
            font-size="14"
          >
            {tick}%
          </text>
        {/each}
      </g>
    {/if}
  </svg>
</div>

<style>
  .chart-container {
    display: block;
    width: 100%;
  }
  .chart {
    overflow: visible;
  }
  .chart-line {
    stroke: lightgrey;
  }
  .chart-y-tick {
    text-anchor: middle;
    alignment-baseline: middle;
    font-family: "Open Sans";
    font-size: 14px;
  }

  .chart-hovered, .chart-selected {
    pointer-events: none;
  }

  .chart-hovered > polyline {
    stroke: #f39431;
    stroke-width: 3;
  }

  .chart-x-axis text {
    fill: #333;
    font-family: "Open Sans";
  }
  .chart-x-axis line {
    stroke: #999;
  }

  .chart-label {
    font-family: "Open Sans";
    font-weight: bold;
    font-size: 25px;
  }
  .chart-pc {
    font-family: "Open Sans";
    font-size: 20px;
  }
</style>
