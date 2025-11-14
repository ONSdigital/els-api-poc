<script>
  import { Plot, BarX, RuleX } from "svelteplot";

  let { data, hovered = null, xKey = "value", yKey = "areacd", selected = null } = $props();
</script>

<Plot height={500} y={{ axis: false}}>
  <BarX
    {data}
    x={xKey}
    y={yKey}
    sort={{ channel: "-x"}}
    onpointerenter={(evt, d) => {console.log("hovered bar:", d[yKey]);hovered = d[yKey];
    }}
    onpointerleave={() => (hovered = null)}
    fill={hovered ? (d) => (d[yKey] === hovered ? "orange" : "grey") : "grey"}
    opacity={hovered ? (d) => (d[yKey] === hovered ? 1 : 0.3) : 0.4}
    />
  <RuleX data={[0]} />
</Plot>

<!-- opacity misbehaving as in line chart -->
<!-- hovered appears at the bottom of the chart, as though all the other data is disappearing... -->