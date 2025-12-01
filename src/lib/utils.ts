import { resolve } from "$app/paths";
import { format } from "d3-format";
import { utcFormat } from "d3-time-format";
import { geoLevels } from "./config/geoLevels";
import { feature } from 'topojson-client';

type jsonDataColumns = { [key: string]: any[] };
type jsonDataRows = { [key: string]: any }[];

export function parseData(data: jsonDataColumns): jsonDataRows {
  const cols = Object.keys(data);
  const rows = [];

  for (let i = 0; i < data[cols[0]].length; i++) {
    const row = {};
    for (const col of cols) row[col] = data[col][i];
    // row.areanm = areaLookup[row.areacd].areanm;
    rows.push(row);
  }
  return rows;
}

export function parseDataKeyed(data, zKey, rowTemplate = {}) {
  if (data.message) return { keyed: {}, array: [] };
  const keyed = {};
  const array = [];
  const cols = Object.keys(data);
  for (let i = 0; i < data[cols[0]].length; i++) {
    const row = { ...rowTemplate };
    for (const col of cols) row[col] = data[col][i];
    row.time = new Date(data.period[i].split("/")[0]);
    if (!keyed[data[zKey][i]]) keyed[data[zKey][i]] = [];
    keyed[data[zKey][i]].push(row);
    array.push(row);
  }
  return { keyed, array };
}

export async function fetchChartData(
  indicator,
  geography = "ltla",
  time = "latest"
) {
  const url = resolve(
    `/api/v0/data.json?indicator=${indicator}&geo=${geography}&time=${time}`
  );
  const data = await (await fetch(url)).json();
  console.log({ data });
  return parseData(data[indicator]);
}

export async function fetchChartDataV1(indicator, dimensions) {
  dimensions = { ...{ geo: "ltla", time: "latest" }, ...dimensions }; // Use default geo + time filters unless explicitly set
  const coreDims = ["geo", "time"];
  const dims = Object.entries(dimensions).map((d) =>
    coreDims.includes(d[0])
      ? `${d[0]}=${[d[1]].join(",")}`
      : `dimension_${d[0]}=${[d[1]].flat().join(",")}`
  );
  const url = resolve(
    `/api/v1/data.cols.json?indicator=${indicator}${dims.length > 0 ? `&${dims.join("&")}` : ""}&includeNames=true`
  );
  const data = await (await fetch(url)).json();
  console.log({ data });
  return parseData(data);
}

export async function fetchTopicsData(
  selected,
  geography = "ltla",
  time = "latest"
) {
  const exclude = ["population-by-age-and-sex"];

  const dataUrl = resolve(`/api/v0/data.json?geo=${geography}&time=${time}`);
  const data = await (await fetch(dataUrl)).json();

  const metaUrl = resolve(
    `/api/v1/metadata/indicators?hasGeo=${selected.areacd}`
  );
  const metadata = await (await fetch(metaUrl)).json();

  // Filter out empty datasets
  const indicators = metadata
    .filter((meta) => !exclude.includes(meta.slug))
    .map((meta) => ({ meta, data: parseData(data[meta.slug]) }));

  const topics = Array.from(
    new Set(indicators.map((ind) => ind.meta.topic))
  ).map((topic) => ({
    key: topic,
    label: topic[0].toUpperCase() + topic.slice(1),
    indicators: indicators.filter((ind) => ind.meta.topic === topic),
  }));
  return topics;
}

export function capitalise(str) {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

export function makeValueFormatter(dp) {
  return format(`,.${dp ?? 0}f`);
}

export function makePeriodFormatter(periodFormat) {
  const parsePeriod = (p) => new Date(p.split("/")[0]);
  const range = +periodFormat.match(/^\d+/)?.[0];
  const formatter =
    periodFormat === "month"
      ? utcFormat("%b %Y")
      : periodFormat === "quarter"
        ? utcFormat("Q%q %Y")
        : periodFormat === "year"
          ? utcFormat("%Y")
          : periodFormat === "academic-year"
            ? (d) => {
              const year = d.getFullYear();
              return `AY ${year}-${(year + 1) % 100}`;
            }
            : periodFormat === "financial-year"
              ? (d) => {
                const year = d.getFullYear();
                return `FY ${year}-${(year + 1) % 100}`;
              }
              : range
                ? (d) => {
                  const year = d.getFullYear();
                  return `${year}-${(year + range) % 100}`;
                }
                : utcFormat("%-d %b %Y");
  return (p) => formatter(parsePeriod(p));
}

export function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string) {
  const matches = text
    .toLowerCase()
    .replace(/'/g, "") // remove apostrophes since we don't want to split apostrophised words
    .replace(/&+/g, "and") // special case 'and'
    .match(/[a-zA-Z0-9]+/g); // match alphanumeric sequences

  return matches ? matches.join("-") : "";
}

export function makeDataUrl(
  indicator,
  timeRange,
  timeNearest = null,
  geoSelected = [],
  geoLevel = null,
  geoExtent = null,
  geoCluster = null
) {
  const base = "/api/v1/data.cols.json";
  const chunks = [];

  if (indicator) chunks.push({ key: "indicator", value: indicator });

  const geoLevelObj = geoLevels[geoLevel];
  const geo = geoLevelObj ? [geoLevel] : [];
  geo.push(
    ...geoSelected.filter((cd) =>
      !geoLevelObj ? true : !geoLevelObj.codes.includes(cd.slice(0, 3))
    )
  );
  if (geo.length > 0) chunks.push({ key: "geo", value: geo.join(",") });
  if (geoExtent) chunks.push({ key: "geoExtent", value: geoExtent });
  if (geoCluster) chunks.push({ key: "geoCluster", value: geoCluster });

  const time = Array.isArray(timeRange) ? timeRange.map(p => String(p).slice(0, 10)).join(",") : String(timeRange).slice(0, 10);
  if (time) chunks.push({ key: "time", value: time });
  if (timeNearest) chunks.push({ key: "timeNearest", value: timeNearest });

  const url = `${base}?${chunks.map((ch) => `${ch.key}=${ch.value}`).join("&")}&includeNames=true`;
  return resolve(url);
}

export function makeGeoJSON(topojson, layer) {
  return feature(topojson, layer);
}
