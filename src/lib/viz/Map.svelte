<script>
  import { feature } from "topojson-client";
  import { Plot, Geo } from "svelteplot";
  import topo from "./topo.json";

  const features = {};
  for (const key of Object.keys(topo.objects)) {
    const geojson = feature(topo, key);
    for (const f of geojson.features) {
      features[f.properties.areacd] = f;
    }
  }

  let { data, idKey = "areacd", labelKey = "areanm", xKey = "value", selected = null } = $props();
  let geo = $derived((() => data.map(d => {
    const feature = features[d[idKey]];
    feature.properties = {...feature.properties, ...d};
    return feature;
  }))());
</script>

<Plot
  projection={{
    type: 'transverse-mercator',
    domain: {type: "FeatureCollection", features: geo}
  }}
  color={{
    scheme: "blues",
    legend: true,
    n: 5,
    type: "linear"
  }}>
  <Geo
    data={geo}
    fill={(d) => d.properties[xKey]}
    title={(d) =>
        `${d.properties[labelKey]}\n${d.properties[xKey]}`} />
</Plot>