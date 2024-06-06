import https from "https";
import fs from "fs";
import { csvFormat } from "d3-dsv";

const metaUrl = "https://raw.githubusercontent.com/ONSvisual/local-statistics/dev/static/insights/config.json";
const dataUrl = "https://raw.githubusercontent.com/ONSvisual/local-statistics/dev/static/insights/individual-datasets";
const metaPath = "./src/routes/api/config.json";
const dataPath = "./src/routes/api/datasets.csv";

export function fetch(url) {
    return new Promise((resolve) => {
        https.get(url, (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                resolve(data);
            });
        })
            .on("error", (err) => {
                console.log("Error: " + err.message);
            });
    });
}

async function run() {
    console.log("Fetching metadata");
    const meta = await (await fetch(metaUrl)).json();
    const ids = Object.values(meta.indicatorsObject).map(ind => ind.metadata.slug);

    const data = [];
    for (const id of ids) {
        console.log(`Fetching ${id}`);
        const ds = await (await fetch(`${dataUrl}/${id}.json`)).json();
        for (let i = 0; i < ds.areacd.length; i++) {
            data.push({
                indicator: id,
                areacd: ds.areacd[i],
                year: ds.xDomainNumb[i],
                value: ds.value[i],
                lci: ds.lci[i],
                uci: ds.uci[i]
            });
        }
    }
    fs.writeFileSync(dataPath, csvFormat(data));
    console.log(`Wrote ${dataPath}`);
    fs.writeFileSync(metaPath, JSON.stringify(meta));
    console.log(`Wrote ${metaPath}`);
}
run();