import { json, error } from "@sveltejs/kit";
import geoGroups from "$lib/geo-groups.js";
import areasClusters from "$lib/areas-clusters.json";
import areasSimilar from "$lib/areas-similar.json";

export function GET({ params }) {
  const code = params.code;
  const similar = areasSimilar[code];
  if (!similar) return error(400, "Similar areas not available for selected code");

  const isLTLA = geoGroups.ltla.codes.includes(code.slice(0, 3));

  const clusters = [];
  const clusterKeys = Object.keys(similar);
  const clusterIndex = areasClusters.data.areacd.indexOf(code);
  for (const key of clusterKeys) {
    const obj = {
      key,
      label: `${key === "global" ? "All" : key[0].toUpperCase() + key.slice(1)} indicators`,
      similar: similar[key]
    };
    if (isLTLA) {
      obj.cluster = {key: areasClusters.data[key][clusterIndex]};
      obj.cluster.label = obj.cluster.key.toUpperCase();
      obj.cluster.areas = areasClusters.data.areacd.filter((cd, i) => areasClusters.data[key][i] === obj.cluster.key);
      obj.cluster.description = areasClusters.descriptions.find(d => d.type === key && d.letter === obj.cluster.key)?.text;
    }
    clusters.push(obj);
  }

  return json(clusters);
}