<script lang="ts">
	import { Embed, Container } from "@onsvisual/svelte-components";

	let { data } = $props();

	$inspect({ data });
</script>

<Embed>
	<Container width="medium">
		<p>Embedded {data.chart} chart for {data.indicator.label}.</p>
	</Container>
</Embed>
