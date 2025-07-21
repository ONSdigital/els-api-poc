<script>
  import { Plot, BarX, RuleX } from "svelteplot";

  let { data, xKey = "value", yKey = "areacd", selected = null } = $props();
</script>

<Plot height={500}>
  <BarX
    {data}
    x={xKey}
    y={yKey}
    sort={{ channel: "-x"}}
    fill="grey"/>
  <RuleX data={[0]} />
</Plot>