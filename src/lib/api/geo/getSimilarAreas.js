import areasClusters from "$lib/data/areas-clusters.json";
import areasSimilar from "$lib/data/areas-similar.json";
import { isValidAreaCode } from "../utils.js";

export default function getSimilarAreas(code) {
  const cdUpper = code?.toUpperCase();
  if (!isValidAreaCode(cdUpper))
    return { error: 400, message: `${code} is not a valid GSS code.` };

  const similar = areasSimilar[cdUpper];
  if (!similar) return [];

  const clusters = [];
  const clusterTypes = areasClusters.types;
  const clusterLookup = areasClusters.lookup[cdUpper];
  
  for (const type of clusterTypes) {
    const obj = {
      key: type,
      label: `${type === "global" ? "All" : type[0].toUpperCase() + type.slice(1)} indicators`,
      similar: similar[type]
    };
    
    if (clusterLookup) {
      const key = clusterLookup[type];
      obj.cluster = {key};
      obj.cluster.label = key.toUpperCase();
      obj.cluster.areas = areasClusters.clusters[type][key];
      obj.cluster.description = areasClusters.descriptions[type][key];
    }
    clusters.push(obj);
  }
  return clusters;
}