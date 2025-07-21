<script>
  import { Plot, Line } from "svelteplot";

  let { data, xKey = "date", yKey = "value", zKey = "areacd", selected = null } = $props();
</script>

<Plot x={{grid: true, tickFormat: (d) => d}}>
  <Line
    data={[...data].sort((a, b) => a[xKey] - b[xKey]).sort((a, b) => a[zKey].localeCompare(b[zKey]))}
    x={xKey}
    y={yKey}
    z={zKey}
    stroke="grey"
    strokeOpacity={0.3}/>
</Plot>