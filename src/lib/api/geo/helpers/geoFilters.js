// Functions to filter geography metadata
import { geoLevels } from "$lib/geo-levels.js";

export function yearFilter(item, year) {
  if (!item.start && !item.end) return true;
  if (!item.end && item.start <= year) return true;
  if (!item.start && item.end >= year) return true;
  if (item.start <= year && item.end >= year) return true;
  return false;
}

export function makeGeoFilter(param) {
  const codes = new Set();
  const types = new Set();
  for (const geo of param) {
    if (geo.match(/^[EKNSW]\d{2}$/)) types.add(geo);
    else if (geoLevels[geo]) {
      for (const code of geoLevels[geo].codes) types.add(code);
    }
    else if (geo.match(/^[EKNSW]\d{8}$/) && !types.has(geo.slice(0, 3))) codes.add(geo);
  }
  return codes.size > 0 && types.size > 0 ? (d) => codes.has(d.areacd) || types.has(d.areacd.slice(0, 3)) :
    types.size > 0 ? (d) => types.has(d.areacd.slice(0, 3)) :
    codes.size > 0 ? (d) => codes.has(d.areacd) :
    () => false;
}

export function makeAreaListFilter(geo, year) {
  if (geo === "all" && year === "all") return null;
  const yFilter = year === "all" ? () => true : yearFilter;
  const gFilter = geo === "all" ? () => true : makeGeoFilter([geo].flat());
  return (d) => yFilter(d, year) && gFilter(d);
}
