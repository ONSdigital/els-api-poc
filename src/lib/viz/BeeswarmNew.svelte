<script>
  import { Plot, Dot, Text } from "svelteplot";
  import { parseDataKeyed } from "$lib/utils";
  import { ONSpalette } from "$lib/config";

  let { data, xKey = "value", yKey = "y", zKey = "areacd", selected = [] } = $props();

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
    r={4}/>
  {#each selected.filter(cd => cd in _data.keyed) as cd, i}
    {@const data = _data.keyed[cd]}
    {@const name = data?.[0]?.areanm}
    <Dot
      {data}
      x={xKey}
      y={() => 0}
      fill={ONSpalette[i]}
      r={6}/>
    <Text
      {data}
      x={xKey}
      y={() => 0}
      dy={-5}
      lineAnchor="bottom"
      fill="black"
      stroke="white"
      strokeWidth={4}
      strokeOpacity={0.7}
      text={name} />
  {/each}
</Plot>