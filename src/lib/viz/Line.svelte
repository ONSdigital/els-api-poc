<script>
  import { Line, Pointer, AxisX, AxisY } from "svelteplot";
  import Plot from "svelteplot/core/Plot.svelte";

  let {
    data,
    hovered = $bindable(),
    xKey = "time",
    yKey = "value",
    zKey = "areacd",
    selected = $bindable(),
  } = $props();

  let _data = $derived.by(() => {
    const keyed = {};
    for (const d of data) {
      if (!keyed[d[zKey]]) keyed[d[zKey]] = [];
      keyed[d[zKey]].push({ ...d, time: new Date(d.period.split("/")[0]) });
    }
    return { keyed, array: Object.values(keyed).flat() };
  });

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
    fn.range = () => range;
    return fn;
  }

  function scaleY({ domain, plotHeight, plotOptions }) {
    const { marginTop, marginBottom } = plotOptions;
    const range = [plotHeight - marginTop - marginBottom, marginBottom];
    const fn = (v) =>
      ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]) +
      range[0];
    fn.range = () => range;
    return fn;
  }
</script>

<Plot
  x={{ domain: xDomain, scale: scaleX }}
  y={{ domain: yDomain, scale: scaleY }}
>
  <AxisX />
  <AxisY />
  <Line
    data={_data.array}
    x={xKey}
    y={yKey}
    z={zKey}
    stroke="grey"
    strokeWidth="1"
    pointerEvent="stroke"
  />
  <Pointer data={_data.array} x={xKey} y={yKey} z={zKey}>
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
  :global(.hovered-line) {
    pointer-events: none !important;
  }
</style>
