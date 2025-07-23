import { readFileSync, writeFileSync } from "fs";

const input = "./src/lib/data.json";
const output = "./src/lib/cube.json";

function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function toRows(data) {
		const cols = Object.keys(data).filter(col => !["id", "code"].includes(col));
		const rows = [];
		for (let i = 0; i < data[cols[0]].length; i ++) {
			const row = {};
			for (const col of cols) row[col] = data[col][i];
			rows.push(row);
		}
		return rows;
	}

function toCube(data, keys = ["areacd", "xDomainNumb"]) {
  for (const key of [...keys].reverse()) data.sort((a, b) => ascending(a[key], b[key]));

  const dimensions = [];
  for (const key of keys) {
    const entries = Array.from(new Set(data.map(d => d[key]))).map((d, i) => [d, i]);
    const values = Object.fromEntries(entries);
    dimensions.push({key, values, count: entries.length});
  }

  function getIndex(row) {
    const coords = [];
    for (const dim of dimensions) {
      coords.push(dim.values[row[dim.key]]);
    }
    let index = 0;
    for (let i = 0; i < coords.length; i ++) {
      index = (index * dimensions[i].count) + coords[i];
    }
    return index;
  }

  const measures = Object.keys(data[0]).filter(key => !keys.includes(key));
  const values = {};
  const valuesLength = dimensions.map(d => d.count).reduce((a, b) => a * b, 1);
  for (const measure of measures) values[measure] = new Array(valuesLength).fill(null);
        
  for (const row of data) {
    const i = getIndex(row);
    for (const measure of measures) {
      values[measure][i] = row[measure];
    }
  }
  return {dimensions, measures, values};
}

console.log(`Reading ${input}...`);
const data = JSON.parse(readFileSync(input)).combinedDataObjectColumnOriented;

console.log("Transforming data to cube...");
const keys = Object.keys(data);
const cube = {};

for (const key of keys) {
  const rows = toRows(data[key]);
  cube[key] = toCube(rows);
}

writeFileSync(output, JSON.stringify(cube));
console.log(`Wrote ${output}`);
