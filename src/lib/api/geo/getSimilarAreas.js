import areasClusters from "$lib/areas-clusters.json";
import areasSimilar from "$lib/areas-similar.json";

export default function getSimilarAreas(code) {
  const similar = areasSimilar[code];
  if (!similar) return null;

  const clusters = [];
  const clusterTypes = areasClusters.types;
  const clusterLookup = areasClusters.lookup[code];
  
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