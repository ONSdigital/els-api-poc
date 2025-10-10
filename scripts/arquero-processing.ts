import * as aq from 'arquero';
import fs, { writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';
import { loadCsvWithoutBom, readJsonSync, readCsvAutoType } from './io.ts';
import {
    abortIfMissingMetadata,
    abortIfNewIndicatorCodesExist,
    abortIfNewPeriodsExist,
    abortIfMultiplePeriodGroupsForOneIndicator,
    abortIfNewFilesExist
} from './data-processing-warnings.ts';
import { table } from 'console';
import { parse } from 'path';

// config.ts
const RAW_DIR = 'scripts/insights/raw';
const CONFIG_DIR = `${RAW_DIR}/config-data`;
const MANIFEST = `${CONFIG_DIR}/manifest_metadata.csv` // equivalent to FILE_NAMES_LOG
// const EXCLUDED_INDICATORS_PATH = `${CONFIG_DIR}/excluded-indicators.json`;
const CSV_PREPROCESS_DIR = `${RAW_DIR}/family-ess-main`
const EXISTING_PERIODS_FILENAME = `${CONFIG_DIR}/periods/unique-periods-lookup.csv`;


export default async function main() {
    // ensure correct version of node
    const nodeVersion = process.version
        .slice(1)
        .split('.')
        .map((d) => +d);
    if (nodeVersion[0] < 20 || (nodeVersion[0] === 20 && nodeVersion[1] < 1)) {
        throw new Error('A more recent node version is needed for recursive directory readdir.');
    }

}

function parsePeriod(str, isQuarterly = false) {
    str = str.replace("T00:00:00", "");
    if (str.match(/\d{4}-\d{4}/)) str = str.replace("-", "/");
    const parts = str.split("/").map(p => p.slice(0, 10));
    if (isQuarterly && parts.length === 1) parts.push("P3M");
    return parts.join("/");
}
function getIndex(row, id, size, dimension) {
    const coords = [];
    for (const key of id) {
        coords.push(dimension[key].category.index[row[key]]);
    }
    let index = 0;
    for (let i = 0; i < coords.length; i++) {
        index = (index * size[i]) + coords[i];
    }
    return index;

}
function processColumns(k, metaLookup, columnValues, id, size, role, dimension) {
    const row = metaLookup.filter(aq.escape(d => d.name === k)).objects()[0]
    const values = columnValues[k]
    const entries = values.map((d, i) => [d, i]);
    id.push(k);
    size.push(values.length);

    dimension[k] = {
        label: k === 'measure' ? 'Measure' : row.titles[1], // measure only exists in tableSchema if there is a column called measure in the csv
        category: { index: Object.fromEntries(entries) }

    };
    // add slugified labels for age and sex
    if (k === 'age') {
        dimension[k].category.label = Object.fromEntries(
            columnValues['age'].map(d => [
                d.replace(/(?<=\d)\sto\s(?=\d)/g, "-"),
                d
            ])
        )
    }

    if (k === 'sex') {
        dimension[k].category.label = Object.fromEntries(
            columnValues['sex'].map(d => [
                d.toLowerCase(),
                d
            ])
        )
    }
    // if it is 'measure' get the names for measure from the metadata
    if (k === 'measure') {
        const lookup = new Map(metaLookup.objects().map(d => [d.name, d.titles[0]]))
        dimension[k].category.label = Object.fromEntries(
            values.map(d => [d, lookup.get(d)])
        )
    }
    // if role metadata exists (currently just areacd and period), add it
    // row doesn't always exist for measure, as it isn't always in the tableSchema
    if (row && row.role) {
        if (!role[row.role]) role[row.role] = [];
        role[row.role].push(k);
    }
    return { id, size, role, dimension }
}
function indicatorToCube(indicator, t, meta_data, tableSchema, dataset_name) {
    console.log('Processing', indicator, '........')
    console.log({dataset_name})
    // filter file-level metadata to be indicator level
    const meta_indicator = meta_data.metadata.indicators.find(d => d.code === indicator)
    const manifest_metadata_indicator = manifest_metadata.filter(aq.escape(d => d.dataset === dataset_name && d.code === indicator)).objects()
    // deconstruct meta_indicator (and remove slug as using slug from csv):
    const { label, caveats, longDescription, slug, ...restOfMetadata } = meta_indicator

    const dataset = {
        version: "2.0",
        class: "dataset",
        label: label,
        note: [caveats].filter(n => n),
        source: meta_data["dc:publisher"],
        updated: meta_data["dc:modified"],
        extension: {
            topic: manifest_metadata_indicator[0].topic,
            subTopic: manifest_metadata_indicator[0].subTopic,
            description: longDescription,
            source: meta_data.metadata.source,
            slug: manifest_metadata_indicator[0].slug,
            ...restOfMetadata,
            experimentalStatistic: meta_data.experimentalStatistic,
            geography: meta_data.metadata.geography
        }
    }

    let indicatorTable = t
        // drop indicator because we don't need it as a column:
        .select(aq.not('indicator'))

    // identify columns of type measure using metadata:
    let measures = tableSchema
        .filter(d => d.type === 'measure')
        .map(d => d.name)

    // identify empty measures to remove (e.g. if lci and uci columns are present but all empty):
    let emptyMeasures = measures.filter(d =>
        indicatorTable.array(d).every(v => v == null || Number.isNaN(v)));

    let indicatorTableLong = indicatorTable
        .select(aq.not(emptyMeasures))
        // pivot longer - measures to single column, values etc. to values - retain status:
        .fold(
            measures.filter(d => !emptyMeasures.includes(d)),
            { as: ['measure', 'value-temp'] }
        ).rename(
            { 'value-temp': 'value' }
        )

    // join unqiue periods lookup to indicator data (ensure indicator period is a string)
    let indicatorTableLong_periods = indicatorTableLong
        .derive({ period: aq.escape(d => String(d.period)) })
        .join_left(periods, ['period'])

    // check for annoying quarterly data decimal years...
    const isQuarterly = indicatorTableLong_periods
        .array('xDomainNumb')
        .some(n => n % 1 !== 0)
    console.log('Indicator contains quarterly data represented by decimals:', isQuarterly)

    ///////////// if needed later?? ///////////////////
    // // create table of all period labels for the indicator
    // const unique_periods_for_each_indicator = indicatorTableLong_periods
    //     .derive({
    //         indicator: aq.escape(() => indicator),
    //         xDomainNumb: d => parsePeriod(d.period, isQuarterly)
    //     })
    //     .dedupe('period', 'xDomainNumb', 'label', 'labelShort', 'labelVeryShort')
    //     .select('indicator','period', 'xDomainNumb', 'label', 'labelShort', 'labelVeryShort')

    // replace the period values with period run through the parsePeriod() function, remove xDomainNumb etc.
    indicatorTableLong_periods = indicatorTableLong_periods
        .derive({
            period: aq.escape(d => parsePeriod(d.period, isQuarterly))
        })
        .select(aq.not('xDomainNumb', 'label', 'labelShort', 'labelVeryShort'))
    // indicatorTableLong_periods.print()

    // identify columns of type dimension using tableschema metadata
    // and exclude areacd and period as we want to ensure those are specified first
    let otherDimensions = tableSchema
        .filter(d => d.type === 'dimension')
        .map(d => d.name)
        .filter(d => !['areacd', 'period'].includes(d))

    // sort by each dimension (including the newly made measure, which is a dimension)
    // age is numbers as strings, so needs sorting properly. could also use Intl.collator for this
    indicatorTableLong_periods = indicatorTableLong_periods
        .derive({ age_sorting: aq.escape(d => parseInt(d.age)) }) // make fake age column that is numeric
        .orderby('areacd', 'period',
            ...otherDimensions.map(col => col === 'age' ? 'age_sorting' : col), // sort age using fake age column
            'measure')
        .select(aq.not('age_sorting'))

    // indicatorTableLong_periods.print()

    // get unique values of all columns in order they appear
    const columnValues = Object.fromEntries(
        indicatorTableLong_periods.columnNames()
            .map(c => [
                c,
                [...new Set(indicatorTableLong_periods.array(c))]
            ])
    )

    // use to construct id, size, role + dimension 
    const id = [];
    const size = [];
    const role = {};
    const dimension = {};

    const metaLookup = aq.from(tableSchema)

    const keys = Object.keys(columnValues).filter(k => k !== "value" && k !== "status")
    for (const k of keys) {
        processColumns(k, metaLookup, columnValues, id, size, role, dimension)
    }

    const valuesLength = size.reduce((a, b) => a * b, 1);
    const value = new Array(valuesLength).fill(null);
    const status = {}

    for (const row of indicatorTableLong_periods) {
        const i = getIndex(row, id, size, dimension);
        value[i] = row.value;
        if (row.status) { status[i] = row.status };
    }

    return { ...dataset, id, size, role, dimension, value, status };
}
function processFile(file, excluded_indicators) {

    const data_file = file.replace(`${CSV_PREPROCESS_DIR}`, '')
    let indicator_data = loadCsvWithoutBom(`${CSV_PREPROCESS_DIR}${data_file}`)
    const meta_data = JSON.parse(fs.readFileSync(`${CSV_PREPROCESS_DIR}${data_file.replace('.csv', '.csv-metadata.json')}`))
    const tableSchema = meta_data.tables[0].tableSchema.columns
    const dataset_name = data_file.split("/")[1]

    // get the column titles of those columns we want to suppress
    const suppressedCols = tableSchema
        .filter(d => d.suppressOutput)
        .map(d => d.titles[0])

    //  rename the columns in data using the information in tableschema 
    // (name is the target title, the first value of titles is the existing column name in the csv)
    const varNames = Object.fromEntries(
        tableSchema
            .filter(d => !suppressedCols.includes(d.titles[0])) // remove columns we are deselecting from this
            .map(d => [d.titles[0], d.name])
    )

    indicator_data = indicator_data
        // drop unused columns using metadata suppressOutput:
        .select(aq.not(suppressedCols))
        .rename(varNames)

    //  filter out unwanted indicators - checks whether the excluded indicator matches the full indicator name
    //  entire files are excluded at an earlier point when creating file_paths
    if (excluded_indicators.length) {
        indicator_data = indicator_data.filter(aq.escape(
            row =>
                !excluded_indicators.includes(row.indicator))
        );
    }

    // split table into one table per indicator
    const indicatorTables =
        Object.fromEntries(
            [...new Set(indicator_data.array('indicator'))]
                .map(ind => [ind, indicator_data.filter(aq.escape(
                    d => d.indicator === ind))])
        );

    console.log('There are ', Object.keys(indicatorTables).length, 'indicator(s) present in data file: ', Object.keys(indicatorTables))
    // define new array
    const indicatorDatasets = []
    // loop through each indicator (when more than one)
    for (const [indicator, t] of Object.entries(indicatorTables)) {
        indicatorDatasets.push(indicatorToCube(indicator, t, meta_data, tableSchema, dataset_name))
    }
    return indicatorDatasets

}

const manifest_metadata = loadCsvWithoutBom(MANIFEST);
const excluded_indicators = manifest_metadata.filter((f) => !f.include).array('code')
// const areas_geog_level = loadCsvWithoutBom(AREAS_GEOG_LEVEL_FILENAME);
// const excludedIndicators = readJsonSync(EXCLUDED_INDICATORS_PATH);

// Throw error if new indicator files have been downloaded and need to be added to the manifest
// await abortIfNewFilesExist(manifest_metadata, CSV_PREPROCESS_DIR)

// remove indicators based on boolean in manifest
// extract distinct filepaths
var file_paths = [
    ...new Set(
        manifest_metadata.filter((f) => f.include)
            .array('filePath')
    )
];

// read in existing periods
// later use this to check for new indicator time periods that need adding
const periods = aq.from(loadCsvWithoutBom(EXISTING_PERIODS_FILENAME, {
    stringColumns: ['period', 'label', 'labelShort']
}).objects());

const cube = {
    version: "2.0",
    class: "collection",
    label: "ELS datasets",
    updated: (new Date()).toISOString().slice(0, 10),
    link: { item: [] }
};

for (const file of file_paths) {
    cube.link.item = [...cube.link.item, ...processFile(file,excluded_indicators)]
}

// console.log(cube.link.item)
const output = "./src/lib/data/json-stat.json";
writeFileSync(output, JSON.stringify(cube));