import { json } from "@sveltejs/kit";
import { getParam } from "$lib/server-utils.js";
import geoMetadata from "$lib/geo-metadata.json";
import geoGroups from "$lib/geo-groups.js";

const geoArray = Object.values(geoMetadata);
const latestYear = Math.max(...geoArray.map(d => d.start || 0));

function yearFilter(item, year) {
  if (!item.start && !item.end) return true;
  if (!item.end && item.start <= year) return true;
  if (!item.start && item.end >= year) return true;
  if (item.start <= year && item.end >= year) return true;
  return false;
}

function makeGeoFilter(param) {
  const codes = new Set();
  const types = new Set();
  for (const geo of param) {
    if (geo.match(/^[EKNSW]\d{2}$/)) types.add(geo);
    else if (geoGroups[geo]) {
      for (const code of geoGroups[geo].codes) types.add(code);
    }
    else if (geo.match(/^[EKNSW]\d{8}$/) && !types.has(geo.slice(0, 3))) codes.add(geo);
  }
  return codes.size > 0 && types.size > 0 ? (d) => codes.has(d.areacd) || types.has(d.areacd.slice(0, 3)) :
    types.size > 0 ? (d) => types.has(d.areacd.slice(0, 3)) :
    codes.size > 0 ? (d) => codes.has(d.areacd) :
    () => false;
}

function makeFilter(geo, year) {
  if (geo === "all" && year === "all") return null;
  const yFilter = year === "all" ? () => true : yearFilter;
  const gFilter = geo === "all" ? () => true : makeGeoFilter([geo].flat());
  return (d) => yFilter(d, year) && gFilter(d);
}

export function GET({ url }) {
  const geo = getParam(url, "geo", "all");
  const year = getParam(url, "year", "latest");
  const includeParents = getParam(url, "includeParents", false);
  const includeChildren = getParam(url, "includeChildren", false);
  const includeDates = getParam(url, "includeDates", false);
  const includeLevel = getParam(url, "includeLevel", false);

  let geos;
  const filter = makeFilter(geo, year === "latest" ? latestYear : year);
  if (filter) geos = geoArray.filter(filter);
  else geos = geoArray;

  return json(geos.map(g => {
    const obj = {areacd: g.areacd, areanm: g.areanm};
    if (includeParents) obj.parents = g.parents;
    if (includeChildren) obj.children = g.children;
    if (includeLevel) obj.level = g.level;
    if (includeDates) {
      for (const key of ["start", "end"]) {
        if (g[key]) obj[key] = g[key];
      }
    }
    return obj;
  }));
}