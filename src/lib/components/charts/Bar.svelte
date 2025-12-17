<script lang="ts">
  import { Plot, BarX, RuleX } from "svelteplot";

  import { scaleLinear } from "d3-scale";
  import { ticks } from "d3-array";
  import { format } from "d3-format";
  import { parseChartData, contrastColor } from "./chartHelpers";
  import { ONSpalette } from "$lib/config";

  let {
    data,
    xKey = "period",
    yKey = "value",
    idKey = "areacd",
    labelKey = "areanm",
    formatValue = (d) => d,
    formatPeriod = (d) => d,
    selected = [],
    hoveredArea = null,
    geoLevel,
  } = $props();

  $inspect(data);

  const height = 300;
  let width = $state();
  const widthThreshold = 550;
  let rightMargin = $derived(width < widthThreshold ? 20 : 150);
  let widthInner = $derived(width - rightMargin - leftMargin);
</script>

<p>Insert excellent bar chart here</p>
