import areasList from "$lib/data/areas-list.json";
import { makeGeoLevelFilter, geoYearFilter } from "./helpers/geoFilters";
import groupAreasByLevel from "./helpers/groupAreasByLevel";
import geoLatestYear from "$lib/data/geo-latest-year.json";
import geoMetadata from "$lib/data/geo-metadata.json";

function makeAreaRow(json, i) {
  const row = { areacd: json.areacd[i], areanm: json.areanm[i] };
  if (json.parentcd[i]) row.parentnm = geoMetadata?.[json.parentcd[i]]?.areanm;
  return row;
}

function makeCombinedFilter(name, geo, year) {
  if (!geo && !year) return (d, i) => name(d.areanm[i]);
  if (!geo && year) return (d, i) => name(d.areanm[i]) && year({start: d.start[i], end: d.end[i]});
  if (geo && !year) return (d, i) => name(d.areanm[i]) && geo(d.areacd[i]);
  return (d, i) => name(d.areanm[i]) && geo(d.areacd[i]) && year({start: d.start[i], end: d.end[i]});
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
  const year = params.year === "latest" ? geoLatestYear : params.year === "all" ? null : params.year;
  const matchesStart = [];
  const matchesWord = [];
  const regexStart = new RegExp(`^${str}`, "i");
  const regexWord = new RegExp(`\b${str}`, "i");

  const geoLevelFilter = params.geoLevel !== "all"
    ? makeGeoLevelFilter(params.geoLevel)
    : null;
  const yearFilter = year ? (area) => geoYearFilter(area, year) : null;
  const startFilter = makeCombinedFilter((nm) => nm.match(regexStart), geoLevelFilter, yearFilter);
  const wordFilter = makeCombinedFilter((nm) => nm.match(regexWord), geoLevelFilter, yearFilter);

  for (let i = 0; i < areasList.areanm.length; i++) {
    if (startFilter(areasList, i)) {
      matchesStart.push(makeAreaRow(areasList, i));
    } else if (wordFilter(areasList, i)) {
      matchesWord.push(makeAreaRow(areasList, i));
    }
    if (matchesStart.length === limit) return params.groupByLevel ? groupAreasByLevel(matchesStart) : matchesStart;
  }

  const matches = [...matchesStart, ...matchesWord].slice(0, limit);

  return params.groupByLevel ? groupAreasByLevel(matches) : matches;
}
