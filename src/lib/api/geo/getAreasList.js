import { makeAreaListFilter } from "./helpers/geoFilters.js";
import geoMetadata from "$lib/data/geo-metadata.json";

const geoArray = Object.values(geoMetadata);
const latestYear = Math.max(...geoArray.map(d => d.start || 0));

export default function getAreasList(params = {}) {
  let areasList;
  const filter = makeAreaListFilter(params.geo, params.year === "latest" ? latestYear : params.year);
  if (filter) areasList = geoArray.filter(filter);
  else areasList = geoArray;

  return areasList.map(g => {
    const obj = {areacd: g.areacd, areanm: g.areanm};
    if (params.includeParents) obj.parents = g.parents;
    if (params.includeChildren) obj.children = g.children;
    if (params.includeLevel) obj.level = g.level;
    if (params.includeDates) {
      for (const key of ["start", "end"]) {
        if (g[key]) obj[key] = g[key];
      }
    }
    return obj;
  });
}