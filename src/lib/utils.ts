//@ts-nocheck
import { resolve } from "$app/paths";
import { format } from "d3-format";
import { utcFormat } from "d3-time-format";

export function parseData(data) {
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
		.replace(/'/g, '') // remove apostrophes since we don't want to split apostrophised words
		.replace(/&+/g, 'and') // special case 'and'
		.match(/[a-zA-Z0-9]+/g); // match alphanumeric sequences

	return matches ? matches.join('-') : '';
}

export const makeCanonicalSlug = (code: string, name?: string) => {
	if (!code) {
		throw 'No area code was given';
	}

	if (name === undefined) {
		return code;
	}

	if (!name) {
		throw 'No area name was given';
	}

	const slugifiedName = slugify(name);
	return `${code}-${slugifiedName}`;
};
