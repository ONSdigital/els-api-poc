import { writeFileSync } from "fs";
import { csvParse, autoType } from "d3-dsv";
import geoGroups from "../src/lib/geo-groups.js";

const topoUrl = "https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json";
const metaUrl = "https://raw.githubusercontent.com/ONSdigital/geo-scripts/refs/heads/main/input/lookups/lookup.csv";
const outputDir = "./src/lib";

const geoCodes = new Set(Object.values(geoGroups).map(g => g.codes).flat());

function getLevels(cd) {
  return Object.keys(geoGroups)
    .filter(key => geoGroups[key].codes.includes(cd.slice(0, 3)));
}

function getChildren(cd, rows) {
  return rows.filter(row => row.parentcd === cd).map(row => row.areacd);
}

function getParents(cds, rows) {
  const cd = cds[cds.length - 1];
  const row = rows.find(row => row.areacd === cd);
  if (row.parentcd) return getParents([...cds, row.parentcd], rows);
  return cds;
}

// Fetch topoJSON
const topo = await(await fetch(topoUrl)).json();
const topoPath = `${outputDir}/topo.json`;
writeFileSync(topoPath, JSON.stringify(topo));
console.log(`Wrote ${topoPath}`);

// Make geography lookup
const rows = csvParse(await(await fetch(metaUrl)).text(), autoType)
  .filter(row => geoCodes.has(row.areacd.slice(0, 3)));

const lookup = {};
for (const row of rows) {
  const obj = {};
  for (const key of ["areacd", "areanm", "start" , "end"]) {
    if (row[key]) obj[key] = row[key];
  }
  obj.level = getLevels(row.areacd);
  obj.parents = row.parentcd ? getParents([row.parentcd], rows) : [];
  obj.children = getChildren(row.areacd, rows);
  lookup[row.areacd] = obj;
}

const geoPath = `${outputDir}/geo-metadata.json`;
writeFileSync(geoPath, JSON.stringify(lookup));
console.log(`Wrote ${geoPath}`);