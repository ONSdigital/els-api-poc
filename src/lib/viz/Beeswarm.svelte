<script>
  import { Plot, Dot, Text, jitterY } from "svelteplot";

  let { data, xKey = "value", yKey = "y", selected = null } = $props();
  let props = $derived(jitterY(
    { data, x: xKey, y: yKey },
    { type: "uniform" }
  ));
</script>

<Plot height={100} y={{axis: false}}>
  <Dot {...props}
    fill="#99999955"
    r={4}/>
  {#if selected}
    <Dot
      data={props.data.filter(d => d.areacd === selected.areacd)}
      x={props.x}
      y={props.y}
      fill="#206095"
      r={6}/>
    <Text
      data={props.data.filter(d => d.areacd === selected.areacd)}
      x={props.x}
      y={props.y}
      dy={-5}
      lineAnchor="bottom"
      fill="black"
      stroke="white"
      strokeWidth={4}
      strokeOpacity={0.7}
      text={selected.areanm} />
  {/if}
</Plot>