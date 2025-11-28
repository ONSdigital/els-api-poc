<script lang="ts">
  import { Plot, BarX, RuleX } from "svelteplot";

  let {
    data,
    hovered = null,
    xKey = "value",
    yKey = "areacd",
    selected = null,
  } = $props();
</script>

<Plot height={500} y={{ axis: false }}>
  <BarX
    {data}
    x={xKey}
    y={yKey}
    sort={{ channel: "-x" }}
    fill= "grey"
  />
  <RuleX data={[0]} />
</Plot>
