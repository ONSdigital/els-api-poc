<script>
  import { Plot, Line, Text } from "svelteplot";
  import { parseDataKeyed } from "$lib/utils";
  import { ONSpalette } from "$lib/config";

  let {
    data,
    xKey = "time",
    yKey = "value",
    zKey = "areacd",
    selected = [],
  } = $props();

  let _data = $derived.by(() => parseDataKeyed(data, zKey));
  let xDomain = $derived.by(() => {
    const xVals = _data.array.map((d) => d[xKey]);
    return [Math.min(...xVals), Math.max(...xVals)];
  });
</script>

<Plot height={100} x={{ ticks: xDomain }} y={{ label: false }}>
  {#each selected.filter(cd => cd in _data.keyed) as cd, i}
    <Line
      data={_data.keyed[cd]}
      x={xKey}
      y={yKey}
      z={zKey}
      stroke={ONSpalette[i]}
      strokeWidth={2}
      markerEnd="dot"
    />
  {/each}
</Plot>
