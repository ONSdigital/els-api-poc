<script>
	import snapdom from "@zumer/snapdom";
	import { Icon, Textarea, Button } from "@onsvisual/svelte-components";

	let { chartType, chartDiv, dataUrl } = $props();

	let showEmbed = $state(false);

	async function downloadPNG(e) {
		e.preventDefault();
		const result = await snapdom(chartDiv);
		await result.download({ format: "png", filename: `${chartType}.png` });
	}
</script>

{#snippet downloadUrl(url, format, formatLabel = null)}
	{@const label = formatLabel || format.toUpperCase()}
	<a href={url?.replace?.(".cols.json", `.${format}`)} download="{chartType}.{format}">{label}</a>
{/snippet}

{#snippet downloadLinks(url)}
	{@render downloadUrl(url, "csv")},
	{@render downloadUrl(url, "csvw")},
	{@render downloadUrl(url, "xlsx")}, or
	{@render downloadUrl(url, "json", "JSON-Stat")}
{/snippet}

<div class="chart-actions">
	<h4 class="chart-actions-label">Use and share</h4>
	<ul class="chart-actions-list">
		<li>
			<Icon type="download" />
			Download as
			{#if chartDiv && chartType !== "table"}
				<a href="#0" onclick={downloadPNG}>PNG</a>,
			{/if}
			{@render downloadLinks(dataUrl)}
		</li>
		<li>
			<Icon type="code" />
			<button class="ons-btn-link" onclick={() => (showEmbed = !showEmbed)}
				>{showEmbed ? "Hide embed code" : "Get embed code"}</button
			>
		</li>
	</ul>
	<div style:display={showEmbed ? "block" : "none"}>
		<Textarea label="Embed code" hideLabel />
		<Button small>Copy to clipboard</Button>
	</div>
</div>

<style>
	.chart-actions {
		background: var(--ons-color-banner-bg);
		padding: 0.5rem;
		margin-bottom: 1rem;
	}
	.chart-actions-label {
		margin: 0;
		font-size: 16px;
	}
	.chart-actions-list {
		list-style-type: none;
		margin: 0;
		padding: 0;
		font-size: 16px;
	}
	.chart-actions-list > li {
		margin: 0;
		display: inline-block;
	}
	.chart-actions-list > li + li {
		margin-left: 0.75rem;
	}
</style>
