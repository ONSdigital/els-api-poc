import { readFileSync, writeFileSync } from "fs";

const config_path = "./src/lib/data/config.json";
const output_clusters = "./src/lib/data/areas-clusters.json";
const output_similar = "./src/lib/data/areas-similar.json";

const config = JSON.parse(readFileSync(config_path));

const similar = config.neighbourLookup;
writeFileSync(output_similar, JSON.stringify(similar));
console.log(`Wrote ${output_similar}`);

const rawClusters = config.clustersLookup;
const clusters = {
  types: rawClusters.types,
  keys: {},
  lookup: {},
  clusters: {},
  descriptions: {}
};

for (const type of clusters.types) {
  clusters.clusters[type] = {};
  clusters.descriptions[type] = {};
  const keys = rawClusters.descriptions.filter(d => d.type === type).map(d => d.letter);
  clusters.keys[type] = keys;

  for (const key of keys) {
    clusters.descriptions[type][key] = rawClusters.descriptions
      .filter(d => d.type === type && d.letter === key)
      .map(d => d.text);
    clusters.clusters[type][key] = rawClusters.data.areacd.filter((d, i) => rawClusters.data[type][i] === key);

    for (const cd of clusters.clusters[type][key]) {
      if (!clusters.lookup[cd]) clusters.lookup[cd] = {};
      clusters.lookup[cd][type] = key;
    }
  }
}

writeFileSync(output_clusters, JSON.stringify(clusters));
console.log(`Wrote ${output_clusters}`);
