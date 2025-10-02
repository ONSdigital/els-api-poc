import areasList from "$lib/data/areas-list.json";
import { makeGeoLevelFilter } from "./helpers/geoFilters";
import groupAreasByLevel from "./helpers/groupAreasByLevel";

function makeAreaRow(json, i) {
  const row = { areacd: json.areacd[i], areanm: json.areanm[i] };
  if (json.parentcd[i]) row.parentcd = json.parentcd[i];
  return row;
}

export default function getAreasByName(params = {}) {
  if (typeof params.name !== "string")
    return { error: 400, message: "No search string provided" };

  if (params.name.match(/\d/)) return []; // Skip search if string contains numbers
  const str = params.name
    .toLowerCase()
    .match(/[a-z'\.\-\s]/g)
    .join(""); // Strip out special characters

  const limit = params.limit || 10;
  const matchesStart = [];
  const matchesWord = [];
  const regexStart = new RegExp(`^${str}`, "i");
  const regexWord = new RegExp(`\b${str}`, "i");

  const geoLevelFilter = params.geoLevel !== "all"
    ? makeGeoLevelFilter(params.geoLevel)
    : null;
  const startFilter = geoLevelFilter
    ? (nm, cd) => nm.match(regexStart) && geoLevelFilter(cd)
    : (nm) => nm.match(regexStart);
  const wordFilter = geoLevelFilter
    ? (nm, cd) => nm.match(regexWord) && geoLevelFilter(cd)
    : (nm) => nm.match(regexWord);

  for (let i = 0; i < areasList.areanm.length; i++) {
    if (startFilter(areasList.areanm[i], areasList.areacd[i])) {
      matchesStart.push(makeAreaRow(areasList, i));
    } else if (wordFilter(areasList.areanm[i], areasList.areacd[i])) {
      matchesWord.push(makeAreaRow(areasList, i));
    }
    if (matchesStart.length === limit) return params.groupByLevel ? groupAreasByLevel(matchesStart) : matchesStart;
  }

  const matches = [...matchesStart, ...matchesWord].slice(0, limit);

  return params.groupByLevel ? groupAreasByLevel(matches) : matches;
}
