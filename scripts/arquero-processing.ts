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
const MANIFEST = `${CONFIG_DIR}/data-files-manifest.csv` // equivalent to FILE_NAMES_LOG
const AREAS_GEOG_LEVEL_FILENAME = `${CONFIG_DIR}/geography/areas-geog-level.csv`;
const EXCLUDED_INDICATORS_PATH = `${CONFIG_DIR}/excluded-indicators.json`;
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

const manifest = loadCsvWithoutBom(MANIFEST); // equivalent to previous_file_paths
// const areas_geog_level = loadCsvWithoutBom(AREAS_GEOG_LEVEL_FILENAME);
const excludedIndicators = readJsonSync(EXCLUDED_INDICATORS_PATH);

// Throw error if new indicator files have been downloaded and need to be added to the manifest
await abortIfNewFilesExist(manifest, CSV_PREPROCESS_DIR)

// remove indicator files based on boolean in manifest (separate process to those in excluded-indicators.json)
const file_paths = manifest.filter((f) => f.include === 'Y')
    .array('filePath');

// read in existing periods
// later use this to check for new indicator time periods that need adding
const periods = aq.from(loadCsvWithoutBom(EXISTING_PERIODS_FILENAME, {
    stringColumns: ['period', 'label', 'labelShort']
}).objects());


function toCube(file) {

    const data_file = file.replace(`${CSV_PREPROCESS_DIR}`, '')
    let indicator_data = loadCsvWithoutBom(`${CSV_PREPROCESS_DIR}${data_file}`)
    const meta_data = JSON.parse(fs.readFileSync(`${CSV_PREPROCESS_DIR}${data_file.replace('.csv', '.csv-metadata.json')}`))
    const tableSchema = meta_data.tables[0].tableSchema.columns

    // get the column titles of those columns we want to suppress
    const supressedCols = tableSchema
        .filter(d => d.supressOutput)
        .map(d => d.titles[0])

    //  rename the columns in data using the information in tableschema 
    // (name is the target title, the first value of titles is the existing column name in the csv)
    const varNames = Object.fromEntries(
        tableSchema.map(d => [d.titles[0], d.name])
    )
    indicator_data = indicator_data
        .rename(varNames)

    //  filter out excludedIndicators - checks whether the excluded indicator matches the full indicator name
    //  entire files are excluded using the manifest
    if (excludedIndicators.length) {
        indicator_data = indicator_data.filter(aq.escape(
            row =>
                !excludedIndicators.includes(row.indicator))
        );
    }

    // split table into one table per indicator
    const indicatorTables =
            Object.fromEntries(
                [...new Set(indicator_data.array('indicator'))]
                    .map(ind => [ind, indicator_data.filter(aq.escape(
                        d => d.indicator === ind))])
            );

    console.log('Indicators present in data file: ', Object.keys(indicatorTables))
    // define new array
    const indicatorDatasets = []
    // loop through each indicator (when more than one)
    for (const [indicator, t] of Object.entries(indicatorTables)) {
        indicatorDatasets.push(processIndicators(indicator, t, meta_data, supressedCols, tableSchema))
    }
    return indicatorDatasets

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
function processIndicatorColumns(k, metaLookup, columnValues, id, size, role, dimension) {
    const row = metaLookup.filter(aq.escape(d => d.name === k)).objects()[0]
    const values = columnValues[k]
    const entries = values.map((d, i) => [d, i]);
    id.push(k);
    size.push(values.length);

    dimension[k] = {
        label: row.titles[0],
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
    if (row.role) {
        if (!role[row.role]) role[row.role] = [];
        role[row.role].push(k);
    }
    return { id, size, role, dimension }
}

function processIndicators(indicator, t, meta_data, supressedCols, tableSchema) {

    // filter file-level metadata to be indicator level
    const meta_indicator = meta_data.metadata.indicators.find(d => d.code === indicator)
    // deconstruct meta_indicator:
    const { label, caveats, longDescription, ...restOfMetadata } = meta_indicator

    const dataset = {
        version: "2.0",
        class: "dataset",
        label: label,
        note: [caveats].filter(n => n),
        source: meta_data.metadata.source,
        // updated: meta_data.metadata.sourceDate,
        extension: {
            //   id: meta.id,
            //   topic: meta.topic,
            //   subTopic: meta.subTopic,
            description: longDescription,
            source: meta_data.metadata.source,
            ...restOfMetadata,
            geography: {
                countries: meta_data.metadata.geographyCountries,
                groups: meta_data.metadata.geographyGroups,
                types: meta_data.metadata.geographyTypes,
                year: meta_data.metadata.geographyYear
            }
        }
    }

    let indicatorTable = t
        // drop unused columns using metadata suppressOutput:
        .select(aq.not(supressedCols))
        // drop indicator because we don't need it as a column:
        .select(aq.not('indicator'))

    // identify columns of type measure using metadata:
    let measures = tableSchema
        .filter(d => d.type === 'measure')
        .map(d => d.name)
    console.log('measures: ', measures)

    // pivot longer - measures to single column, values etc. to values - retain status
    let indicatorTableLong = indicatorTable.fold(
        measures,
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
    console.log('There are ', otherDimensions.length, 'other dimensions additional to areacd and period: ', otherDimensions)

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

    const keys = Object.keys(columnValues).filter(k => k !== "value")
    for (const k of keys) {
        processIndicatorColumns(k, metaLookup, columnValues, id, size, role, dimension)
    }

    const valuesLength = size.reduce((a, b) => a * b, 1);
    const value = new Array(valuesLength).fill(null);

    for (const row of indicatorTableLong_periods) {
        const i = getIndex(row, id, size, dimension);
        value[i] = row.value;
    }
    return { ...dataset, id, size, role, dimension, value };
}

const cube = {
    version: "2.0",
    class: "collection",
    label: "ELS datasets",
    updated: (new Date()).toISOString().slice(0, 10),
    link: { item: [] }
};

for (const file of file_paths) {
    // cube.link.item.push(toCube(file));
    cube.link.item = [...cube.link.item, ...toCube(file)]
}

// console.log(cube.link.item)
