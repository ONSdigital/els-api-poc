<script lang="ts">
  import { Line, Pointer, AxisX, AxisY } from "svelteplot";
  import Plot from "svelteplot/core/Plot.svelte";

  let {
    data,
    hovered = false,
    xKey = "time",
    yKey = "value",
    zKey = "areacd",
    selected = $bindable(),
  } = $props();

  const nticks = 2; 
  // not got this to properly work yet

  let _data = $derived.by(() => {
    const keyed = {};
    for (const d of data) {
      if (!keyed[d[zKey]]) keyed[d[zKey]] = [];
      keyed[d[zKey]].push({ ...d, time: new Date(d.period.split("/")[0]) });
    }
    return { keyed, array: Object.values(keyed).flat() };
  });

  $inspect(_data);

  let xDomain = $derived.by(() => {
    const vals = _data.array.map((d) => d[xKey]);
    return [Math.min(...vals), Math.max(...vals)];
  });

  let yDomain = $derived.by(() => {
    const vals = _data.array.map((d) => d[yKey]);
    return [Math.min(...vals), Math.max(...vals)];
  });

  function scaleX({ domain, plotWidth, plotOptions }) {
    const { marginLeft, marginRight } = plotOptions;
    const range = [marginLeft, plotWidth - marginLeft - marginRight];
    const fn = (v) =>
      ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]) +
      range[0];
    fn.domain = () => domain;
    fn.range = () => range;
    fn.ticks = (count = nticks) => {
      const step = (domain[1] - domain[0]) / count;
      return Array.from({ length: count + 1 }, (_, i) => domain[0] + i * step);
    };
    return fn;
  }

  function scaleY({ domain, plotHeight, plotOptions }) {
    const { marginTop, marginBottom } = plotOptions;
    const range = [plotHeight, marginBottom];
    const fn = (v) =>
      ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]) +
      range[0];
    fn.domain = () => domain;
    fn.range = () => range;
    fn.ticks = (count = nticks) => {
      const step = (domain[1] - domain[0]) / count;
      return Array.from({ length: count + 1 }, (_, i) => domain[0] + i * step);
    };
    return fn;
  }

  $inspect(hovered)
</script>

<Plot
  x={{ domain: xDomain, scale: scaleX }}
  y={{ domain: yDomain, scale: scaleY }}
>
  <AxisX
    anchor="bottom"
    stroke="black"
    strokeWidth={1}
    tickFormat={(v) => {
      const d = v instanceof Date ? v : new Date(v);
      return d.toISOString().slice(0, 4);
    }}
  />
  <AxisY anchor="left" stroke="black" />
  <Line
    data={_data.array}
    x={xKey}
    y={yKey}
    z={zKey}
    stroke="grey"
    strokeWidth="1"
    onpointerenter={() => hovered = true}
    onpointerleave={() => hovered = false}
    opacity={(d) => hovered ? 0.3 : 1}
    pointerEvents="stroke"
  />
  <Pointer data={_data.array} x={xKey} y={yKey} z={zKey} maxDistance={20}>
    {#snippet children({ data })}
      <Line
        class="hovered-line"
        data={data[0] ? _data.keyed[data[0][zKey]] : []}
        x={xKey}
        y={yKey}
        z={zKey}
        stroke="orange"
        strokeWidth="3"
        strokeOpacity="1"
      />
    {/snippet}
  </Pointer>
</Plot>

<style>
</style>
