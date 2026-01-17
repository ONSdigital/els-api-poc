function getDimColumns(datasets: jsonStatDataset[]) {
    const cols = {};
    for (const ds of datasets) {
        const keys = ds.id.slice(0, -1);
        for (const key of keys) {
            cols[key] = {
                name: key,
                titles: ds.dimension[key].label || key,
                datatype: key === "period" ? "date" : "string",
            };
        }
    }
    return Object.values(cols);
}

function getMeasureColumns(datasets: jsonStatDataset[], measure: parsedParam) {
    const filter = [measure].flat();
    const cols = {};
    for (const ds of datasets) {
        const cat = ds.dimension.measure.category;
        for (const key in cat.index) {
            if (filter[0] === "all" || filter.includes(key))
                cols[key] = { name: key, titles: cat.label[key], datatype: "number" };
        }
    }
    return Object.values(cols);
}

function makeCSVWColumns(
    datasets: jsonStatDataset[],
    measure: parsedParam,
    singleIndicator: boolean,
    includeNames: boolean,
    includeStatus: boolean
) {
    const cols = [
        {
            name: "indicator",
            titles: "Indicator",
            datatype: "string",
        },
    ];
    cols.push(...getDimColumns(datasets));
    cols.push(...getMeasureColumns(datasets, measure));
    if (includeNames)
        cols.splice(2, 0, {
            name: "areanm",
            titles: "Area name",
            datatype: "string",
        });
    if (includeStatus)
        cols.push({
            name: "status",
            titles: "Status",
            datatype: "string",
        });
    if (singleIndicator) cols.shift();
    return cols;
}

export default function generateCSVW(
    datasets: jsonStatDataset[],
    measure: parsedParam,
    href: string,
    singleIndicator: boolean,
    includeNames: boolean,
    includeStatus: boolean
) {
    const dateString = new Date().toISOString().slice(0, 10);
    let metadata = {
        "@context": ["http://www.w3.org/ns/csvw", { "@language": "en" }],
        url: href.replace(".csvw", ".csv"),
        "rdfs:label": `Combined datasets retrieved from Explore Local Statistics on ${dateString}`,
    };
    if (datasets.length === 1) {
        const ds = datasets[0];
        metadata = {
            ...metadata,
            "rdfs:label": `Dataset retrieved from Explore Local Statistics on ${dateString}`,
            "dc:title": ds.label,
            "dc:description": ds.extension.description,
            "dc:creator": ds.source,
            "dc:source": ds.extension.source[0].url,
            "dc:publisher": "Office for National Statistics",
            "dc:issued": ds.updated,
        };
    }
    metadata.tableSchema = {
        columns: makeCSVWColumns(
            datasets,
            measure,
            singleIndicator,
            includeNames,
            includeStatus
        ),
    };
    return metadata;
}