import { base } from "$app/paths";
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
  const url = `${base}/api/v1/data.json?indicator=${indicator}&geography=${geography}&time=${time}`;
  const data = await (await fetch(url)).json();
  console.log({data})
  return parseData(data[indicator]);
}

export async function fetchTopicsData(selected, geography = "ltla", time = "latest") {
  const url = `${base}/api/v1/data.json?geography=${geography}&time=${time}`;
  let data = await (await fetch(url)).json();

  // Filter out empty datasets
  const indicators = Object.keys(data).map(key => {
    const meta = metadata[key];
    return {meta, data: parseData(data[key])};
  }).filter(ind => ind.meta.inferredGeos.types.includes(selected.areacd.slice(0, 3)))
    .filter(ind => ind.data[0])
  const topics = Array.from(new Set(indicators.map(ind => ind.meta.topic)))
    .map(topic => ({
      key: topic,
      label: `${topic[0].toUpperCase()}${topic.slice(1)}`,
      indicators: indicators.filter(ind => ind.meta.topic === topic)
    }));
  return topics;
}