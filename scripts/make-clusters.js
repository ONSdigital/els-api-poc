import { readFileSync, writeFileSync } from "fs";

const config_path = "./src/lib/config.json";
const output_clusters = "./src/lib/areas-clusters.json";
const output_similar = "./src/lib/areas-similar.json";

const config = JSON.parse(readFileSync(config_path));

const clusters = config.clustersLookup;
writeFileSync(output_clusters, JSON.stringify(clusters));
console.log(`Wrote ${output_clusters}`);

const similar = config.neighbourLookup;
writeFileSync(output_similar, JSON.stringify(similar));
console.log(`Wrote ${output_similar}`);
