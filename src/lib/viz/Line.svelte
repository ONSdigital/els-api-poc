<script>
  import { Plot, Line, Dot } from "svelteplot";

  let {
    data,
    hovered = $bindable(),
    xKey = "time",
    yKey = "value",
    zKey = "areacd",
    selected = $bindable(),
  } = $props();

  let keyedData = $derived.by(() => {
    const keyed = {};
    for (const d of data){
      if (!keyed[d[zKey]]) keyed[d[zKey]] = []
      keyed[d[zKey]].push({ ...d, time: new Date(d.period.split("/")[0]) });
    }
    return keyed;
  });

  $inspect(keyedData)
</script>

<Plot x={{ grid: false }}>
  <Line
    data={Object.values(keyedData).flat()}
    x={xKey}
    y={yKey}
    z={zKey}
    onpointerenter={(evt, d) => {
      console.log("hovered series:", d.datum[zKey]);
      hovered = d.datum[zKey];
    }}
    onpointerleave={() => (hovered = null)}
    stroke= "grey"
    strokeWidth="1"
    pointerEvent="stroke"
  />
    <Line class = "hovered-line"
      data={hovered ? keyedData[hovered] : []}
      x={xKey}
      y={yKey}
      z={zKey}
      stroke="orange"
      strokeWidth="3"
      strokeOpacity="1"
    />
</Plot>

<style>
  :global(.hovered-line) {
    pointer-events: none !important;
  }
</style>