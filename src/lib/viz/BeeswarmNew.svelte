<script>
  import { Plot, Dot, Text } from "svelteplot";
  import { parseDataKeyed } from "$lib/utils";
  import { ONSpalette } from "$lib/config";

  let { data, xKey = "value", yKey = "y", zKey = "areacd", selected = [], hovered = $bindable(), visible = true } = $props();

  let _data = $derived.by(() => {
    const _data = parseDataKeyed(data, zKey);
    for (const d of _data.array) d.y = Math.random();
    return _data;
  });
</script>

<Plot height={100} x={{label: false}} y={{axis: false}}>
  <Dot
    data={_data.array}
    x={xKey}
    y={yKey}
    fill="#99999955"
    r={4}
    onmouseover={(e, d) => hovered = d[zKey]}
    onmouseleave={() => hovered = null}/>
  {#each (visible ? [...selected, hovered] : selected).filter(cd => cd in _data.keyed) as cd, i}
    {@const data = _data.keyed[cd]}
    {@const name = data?.[0]?.areanm}
    <Dot
      class="active-dot"
      {data}
      x={xKey}
      y={(d) => d[zKey] === hovered ? d[yKey] : 0}
      fill={(d) => d[zKey] === hovered ? "orange" : ONSpalette[i]}
      r={6}/>
    <Text
      class="active-label"
      {data}
      x={xKey}
      y={(d) => d[zKey] === hovered ? d[yKey] : 0}
      dy={-5}
      lineAnchor="bottom"
      fill="black"
      stroke="white"
      strokeWidth={4}
      strokeOpacity={0.7}
      text={name} />
  {/each}
</Plot>

<style>
  :global(.active-dot), :global(.active-label) {
    pointer-events: none;
  }
</style>