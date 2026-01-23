<script lang="ts">
	import { scaleLinear, scaleBand } from "d3-scale";
	import { parsePyramidData } from "./chartHelpers";
	import { ONSpalette } from "$lib/config";
	import { contrastColor } from "./chartHelpers";

	let {
		data,
		selected = [],
		hovered = $bindable(),
		idKey = "areacd",
		xKey = "value",
		yKey = "age",
		zKey = "sex"
	} = $props();

	const barHeight = 18;
	const barGap = 1; // gap in pixels
	const gutter = 70;
	const bottomMargin = 20;

	const _data = parsePyramidData(data, idKey);

	let w = $state(400);
	let hoveredPos = $state();

	let xRange = $derived([0, (w - gutter) / 2]);
	let xScale = $derived(scaleLinear().domain(_data.valueDomain).range(xRange));
	let yRange = $derived([barHeight * _data.categoryDomain.length, 0]);
	let yScale = $derived(
		scaleBand()
			.domain(_data.categoryDomain)
			.range(yRange)
			.paddingInner(barGap / (barHeight + barGap))
	);

	function sumBySex(area, sex) {
		const areaData = _data.keyed[area] || [];
		return areaData.filter((d) => d.sex === sex).reduce((acc, d) => acc + d.value, 0);
	}

	function makeLine(dat, xScale, sex) {
		const scale =
			sex === "female"
				? (d) => xRange[1] - xScale(d[xKey])
				: (d) => xRange[1] + gutter + xScale(d[xKey]);
		return dat
			.filter((d) => d[zKey] === _data.groupDomain[sex === "female" ? 0 : 1])
			.flatMap((d) => [
				[scale(d), yScale(d[yKey]) + yScale.bandwidth() + barGap / 2], // bottom left
				[scale(d), yScale(d[yKey]) - barGap / 2] // top left
			])
			.map((p) => p.join(","))
			.join(" ");
	}
</script>

{#snippet mark(d)}
	{#if d[zKey] === _data.groupDomain[0]}
		<line
			class="chart-mark"
			x1={xRange[1] - xScale(d[xKey])}
			y1={yScale(d[yKey])}
			x2={xRange[1] - xScale(d[xKey])}
			y2={yScale(d[yKey]) + yScale.bandwidth()}
		/>
	{:else}
		<line
			class="chart-mark"
			x1={xScale(d[xKey]) + xRange[1] + gutter}
			y1={yScale(d[yKey])}
			x2={xScale(d[xKey]) + xRange[1] + gutter}
			y2={yScale(d[yKey]) + yScale.bandwidth()}
		/>
	{/if}
{/snippet}

{#snippet polyline(points, color = "grey", width = 2)}
	<polyline class="chart-line" stroke="white" stroke-width={width + 2} {points} />
	<polyline class="chart-line" stroke={color} stroke-width={width} {points} />
{/snippet}

{#snippet tick(t, sex)}
	{@const xPos = sex === "female" ? xRange[1] - xScale(t) : xScale(t) + xRange[1] + gutter}
	<line x1={xPos} y1={yRange[0]} x2={xPos} y2={yRange[0] + 8} />
	<text x={xPos} y={yRange[0] + 22} text-anchor="middle" font-size="14">
		{t}%
	</text>
{/snippet}

<div class="chart-container" bind:clientWidth={w}>
	<svg class="chart" viewBox="0 0 {w} {yRange[0] + bottomMargin}">
		{#if xRange && xScale}
			<g class="chart-y-axis">
				{#each _data.categoryDomain as yTick}
					<text class="chart-y-tick" x={w / 2} y={yScale(yTick) + yScale.bandwidth() / 2} dy={2}>
						{yTick}
					</text>
				{/each}
				<line
					class="chart-baseline"
					x1={xScale(0) + xRange[1] + gutter}
					y1={0}
					x2={xScale(0) + xRange[1] + gutter}
					y2={yRange[0]}
				/>
				<line
					class="chart-baseline"
					x1={xScale(0) + xRange[1]}
					y1={0}
					x2={xScale(0) + xRange[1]}
					y2={yRange[0]}
				/>
			</g>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<g
				class="chart-background"
				onmouseleave={() => {
					hovered = null;
					hoveredPos = null;
				}}
			>
				{#each Object.entries(_data.keyed) as areaData}
					<g
						class:chart-hovered={areaData[0] === hovered}
						onmouseenter={(e) => {
							hovered = areaData[0];
							hoveredPos = { x: e.offsetX, y: e.offsetY };
							e.target.parentNode.appendChild(e.target);
						}}
					>
						{#each areaData[1] as d}
							{@render mark(d)}
						{/each}
					</g>
				{/each}
			</g>
			{#if _data.keyed[hovered]}
				<g class="chart-hovered">
					{@render polyline(makeLine(_data.keyed[hovered], xScale, "female"), "orange", 3)}
					{@render polyline(makeLine(_data.keyed[hovered], xScale, "male"), "orange", 3)}
				</g>
			{:else if selected.length}
				{@const maxIndex = selected.length - 1}
				<g class="chart-selected">
					{#each [...selected].reverse() as area, i}
						{@render polyline(
							makeLine(_data.keyed[area], xScale, "female"),
							ONSpalette[maxIndex - i],
							i === maxIndex ? 3 : 2
						)}
						{@render polyline(
							makeLine(_data.keyed[area], xScale, "male"),
							ONSpalette[maxIndex - i],
							i === maxIndex ? 3 : 2
						)}
					{/each}
				</g>
			{/if}

			<g class="chart-x-axis">
				{#each xScale.ticks(3) as t}
					{@render tick(t, "female")}
					{@render tick(t, "male")}
				{/each}
			</g>
		{/if}
	</svg>
	<div class="chart-annotations">
		{#each _data.groupDomain as group, i}
			<div
				class="chart-legend"
				style:text-align={i === 0 ? "left" : "right"}
				style:left={i === 0 ? 0 : null}
				style:right={i === 1 ? 0 : null}
			>
				{group}
				{#if hovered || selected.length}
					{@const color = hovered ? "orange" : ONSpalette[0]}
					<br /><span
						class="chart-label"
						style:background={color}
						style:color={contrastColor(color)}
						>{Math.round(sumBySex(hovered || selected[0], group) * 10) / 10}%</span
					>
				{/if}
			</div>
		{/each}
		{#if hovered && hoveredPos}
			<div
				class="chart-label chart-area-label"
				style:left="{hoveredPos.x}px"
				style:top="{hoveredPos.y}px"
				style:transform="translate({hoveredPos.x < w / 2 ? -100 : 0}%,-100%)"
			>
				{_data.keyed?.[hovered]?.[0]?.areanm}
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		display: block;
		position: relative;
		width: 100%;
		margin: 1rem 0;
	}
	.chart {
		overflow: visible;
	}
	.chart-annotations {
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.chart-legend {
		position: absolute;
		top: 0;
	}
	.chart-label {
		display: block;
		font-weight: bold;
		padding: 4px 6px;
		border-radius: 4px;
		font-weight: bold;
		line-height: 1.2;
	}
	.chart-area-label {
		position: absolute;
		background-color: orange;
	}
	.chart-baseline {
		stroke: #b3b3b3;
		stroke-width: 1.5px;
	}
	.chart-mark {
		stroke: lightgrey;
		stroke-width: 1px;
	}
	.chart-y-tick {
		text-anchor: middle;
		alignment-baseline: middle;
		font-size: 14px;
	}

	.chart-hovered,
	.chart-selected {
		pointer-events: none;
	}

	.chart-line {
		fill: none;
	}

	.chart-x-axis text {
		fill: #333;
		font-family: "Open Sans";
	}
	.chart-x-axis line {
		stroke: #999;
	}
</style>
