<script>
  import { feature } from "topojson-client";
  import { Plot, Geo } from "svelteplot";
  import topo from "./topo.json";

  const oldGeoCodesLookup = {
    E06000048: 'E06000057',
    E08000020: 'E08000037',
    E07000097: 'E07000242',
    E07000100: 'E07000240',
    E07000101: 'E07000243',
    E07000104: 'E07000241'
  };

  const features = {};
  for (const key of Object.keys(topo.objects)) {
    const geojson = feature(topo, key);
    for (const f of geojson.features) {
      features[f.properties.areacd] = f;
    }
    for (const code in oldGeoCodesLookup) features[code] = features[oldGeoCodesLookup[code]];
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