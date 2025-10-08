import geoMetadata from "$lib/data/geo-metadata.json";
import { geoLevelsArray } from "$lib/config/geo-levels.js";
import { geoYearFilter } from "./helpers/geoFilters";

const geoArray = Object.values(geoMetadata);
const latestYear = Math.max(...geoArray.map(d => d.start || 0));

export default function getGeoLevels(params = {}) {
  if (!params.includeAreas) return geoLevelsArray;

  const yFilter = params.year === "all" ? () => true :
    params.year === "latest" ? (d) => geoYearFilter(d, latestYear) :
    (d) => geoYearFilter(d, year);
  
  return geoLevelsArray.map(g => {
    const obj = {...g};
    const codes = new Set(obj.codes);
    obj.areas = geoArray.filter(d => codes.has(d.areacd.slice(0, 3)) && yFilter(d)).map(d => d.areacd);
    return obj;
  });
}