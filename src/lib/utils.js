import { resolve } from "$app/paths";
import metadata from "$lib/data/metadata.json";

export function parseData(data) {
  const cols = Object.keys(data);
  const rows = [];

  for (let i = 0; i < data[cols[0]].length; i ++) {
    const row = {};
    for (const col of cols) row[col] = data[col][i];
    rows.push(row);
  }
  return rows;
}

export async function fetchChartData(indicator, geography = "ltla", time = "latest") {
  const url = resolve(`/api/v1/data.json?indicator=${indicator}&geo=${geography}&time=${time}`);
  const data = await (await fetch(url)).json();
  console.log({data})
  return parseData(data[indicator]);
}

export async function fetchTopicsData(selected, geography = "ltla", time = "latest") {
  const exclude = ["population-by-age-and-sex"];

  const dataUrl = resolve(`/api/v1/data.json?geo=${geography}&time=${time}`);
  const data = await (await fetch(dataUrl)).json();

  const metaUrl = resolve(`/api/v1/metadata/indicators?geo=${selected.areacd}`);
  const metadata = await (await fetch(metaUrl)).json();

  // Filter out empty datasets
  const indicators = metadata
    .filter(meta => !exclude.includes(meta.slug))
    .map(meta => ({meta, data: parseData(data[meta.slug])}));

  const topics = Array.from(new Set(indicators.map(ind => ind.meta.topic)))
    .map(topic => ({
      key: topic,
      label: topic[0].toUpperCase() + topic.slice(1),
      indicators: indicators.filter(ind => ind.meta.topic === topic)
    }));
  return topics;
}