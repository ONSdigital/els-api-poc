import geoMetadata from "$lib/data/geo-metadata.json";
import { makeAreaListFilter } from "./helpers/geoFilters.js";
import groupAreasByLevel from "./helpers/groupAreasByLevel.js";
import makeAreasLookup from "./helpers/makeAreasLookup.js";

const geoArray = Object.values(geoMetadata);
const latestYear = Math.max(...geoArray.map((d) => d.start || 0));

export default function getAreasList(params = {}) {
  let areasList;
  const filter = makeAreaListFilter(
    params.geo,
    params.year === "latest" ? latestYear : params.year
  );
  if (filter) areasList = geoArray.filter(filter);
  else areasList = geoArray;

  const areas = areasList.map((g) => {
    const obj = { areacd: g.areacd, areanm: g.areanm };
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

  return params.asLookup
    ? makeAreasLookup(areas)
    : params.groupByLevel
      ? groupAreasByLevel(areas)
      : areas;
}
