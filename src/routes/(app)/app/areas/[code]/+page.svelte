<script lang="ts">
	import { analyticsEvent, Hero } from '@onsvisual/svelte-components';
    import topojson from '$lib/data/topo.json';

     let { data } = $props();
  $inspect(data);
</script>

<Hero
  title="Area navigation page for {data.code}"
  width="medium"
  background="#eaeaea"
  
></Hero>
