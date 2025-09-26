<script>
  import { Plot, Line } from "svelteplot";

  let { data, xKey = "time", yKey = "value", zKey = "areacd", selected = null } = $props();
</script>

<Plot x={{grid: true}}>
  <Line
    data={data.map(d => ({...d, time: new Date(d.period.split("/")[0])}))}
    x={xKey}
    y={yKey}
    z={zKey}
    stroke="grey"
    strokeOpacity={0.3}/>
</Plot>