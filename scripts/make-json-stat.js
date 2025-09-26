import { readFileSync, writeFileSync } from "fs";

const data_path = "./src/lib/data/data.json";
const config_path = "./src/lib/data/config.json";
const output_data = "./src/lib/data/json-stat.json";
const output_meta = "./src/lib/data/json-stat-metadata.json";

const columns = [
  {key: "areacd", label: "Area code", role: "geo"},
  {key: "period", label: "Time period", role: "time"},
  {key: "value", label: "Value", group: "measure"},
  {key: "lci", label: "Lower confidence interval", group: "measure"},
  {key: "uci", label: "Upper confidence interval", group: "measure"}
];
const measures = columns.filter(col => col?.group === "measure").map(col => col.key);
const columnsLookup = {measure: {label: "Measure"}};
for (const col of columns) columnsLookup[col.key] = col;

function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function parseSourceDate(str) {
  const dates = str.split("|")
    .map(d => new Date(d.split("/").reverse().join("-")))
    .sort((a, b) => b - a);
  return dates[0].toISOString().slice(0, 10);
}

function makeSource(meta) {
  const orgs = meta.sourceOrg.split("|");
  const urls = meta.sourceURL.split("|");
  const dates = meta.sourceDate.split("|").map(d => parseSourceDate(d));

  return orgs.map((d, i) => ({
    name: d,
    href: urls[i],
    date: dates[i]
  }));
}

function parsePeriod(str, isQuarterly = false) {
  str = str.replace("T00:00:00", "");
  if (str.match(/\d{4}-\d{4}/)) str = str.replace("-", "/");
  const parts = str.split("/").map(p => p.slice(0, 10));
  if (isQuarterly && parts.length === 1) parts.push("P3M");
  return parts.join("/");
}

function filterMetadata(metadata) {
  const skipKeys = ["label", "caveats", "longDescription", "sourceDate", "sourceURL", "sourceOrg"];

  const filtered = {};
  for (const key of Object.keys(metadata).filter(k => !skipKeys.includes(k))) {
    filtered[key] = metadata[key] === "T" ? true : metadata[key] === "F" ? false : metadata[key];
  }
  return filtered;
}

function toRows(data, periods) {
  const vals = measures.filter(val => data[val].filter(d => d).length > 0);
  const cols = Object.keys(data).filter(col => !["id", "code", ...measures].includes(col));
  const periodsLookup = {};
  const isQuarterly = periods.map(p => p.xDomainNumb % 1).filter(n => n).length > 0;
  for (const p of periods) periodsLookup[p.xDomainNumb] = parsePeriod(p.period, isQuarterly);

  const rows = [];
  for (let i = 0; i < data[cols[0]].length; i ++) {
    for (const val of vals) {
      const row = {};
      for (const col of cols) {
        if (col === "xDomainNumb") {
          row.period = periodsLookup[data[col][i]];
        }
        else row[col] = data[col][i];
      }
      row.measure = val;
      row.value = data[val][i];
      rows.push(row);
    }
  }
  return rows;
}

function toCube(data, meta) {
  // Scaffold dataset and copy over metadata
  const dataset = {
    version: "2.0",
    class: "dataset",
    label: meta.metadata.label,
    note: [meta.metadata.caveats].filter(n => n),
    source: meta.metadata.sourceOrg.split("|").join(", "),
    updated: parseSourceDate(meta.metadata.sourceDate),
    extension: {
      id: meta.id,
      topic: meta.topic,
      subTopic: meta.subTopic,
      description: meta.metadata.longDescription,
      source: makeSource(meta.metadata),
      ...filterMetadata(meta.metadata),
      geography: {
        countries: meta.inferredGeos.ctrys,
        types: meta.inferredGeos.types,
        year: meta.inferredGeos.year
      }
    }
  }

  const keys = Object.keys(data[0]).filter(key => key !== "value");

  // Sort data
  for (const key of [...keys].reverse()) data.sort((a, b) => ascending(a[key], b[key]));

  // Add dimensions metadata
  const id = [];
  const size = [];
  const role = {};
  const dimension = {};

  for (const key of keys) {
    const col = columnsLookup[key];
    const values = Array.from(new Set(data.map(d => d[key])))
    const entries = values.map((d, i) => [d, i]);
    id.push(key);
    size.push(entries.length);
    dimension[key] = {
      label: col.label || key,
      category: {index: Object.fromEntries(entries)}
    };
    if (key === "measure") {
      const labels = values.map(d => [d, columnsLookup?.[d]?.label || d]);
      dimension[key].category.label = Object.fromEntries(labels);
    }
    if (col.role) {
      if (!role[col.role]) role[col.role] = [];
      role[col.role].push(key);
    }
  }

  function getIndex(row) {
    const coords = [];
    for (const key of id) {
      coords.push(dimension[key].category.index[row[key]]);
    }
    let index = 0;
    for (let i = 0; i < coords.length; i ++) {
      index = (index * size[i]) + coords[i];
    }
    return index;
  }

  const valuesLength = size.reduce((a, b) => a * b, 1);
  const value = new Array(valuesLength).fill(null);
  
  for (const row of data) {
    const i = getIndex(row);
    value[i] = row.value;
  }
  return {...dataset, id, size, role, dimension, value};
}

console.log(`Reading ${data_path}...`);
const data = JSON.parse(readFileSync(data_path)).combinedDataObjectColumnOriented;

console.log(`Reading ${config_path}...`);
const config = JSON.parse(readFileSync(config_path));

console.log("Transforming data to cube...");
const keys = Object.keys(data);

const cube = {
  version: "2.0",
  class: "collection",
  label: "ELS datasets",
  updated: (new Date()).toISOString().slice(0, 10),
  link: {item: []}
};

for (const key of keys) {
  const meta = config.indicatorsObject[key];
  const periods = config.periodsLookupObject[meta.id]
  const rows = toRows(data[key], periods);
  cube.link.item.push(toCube(rows, meta));
}

writeFileSync(output_data, JSON.stringify(cube));
console.log(`Wrote ${output_data}`);

// Strip data to write metadata only
cube.link.item = cube.link.item.map(ds => {
  ds.value = [];
  return ds;
});

writeFileSync(output_meta, JSON.stringify(cube));
console.log(`Wrote ${output_meta}`);