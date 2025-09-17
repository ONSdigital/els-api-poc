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

// config.ts
const RAW_DIR = 'scripts/insights/raw';
const CONFIG_DIR = `${RAW_DIR}/config-data`;
const MANIFEST = `${CONFIG_DIR}/data-files-manifest.csv` // equivalent to FILE_NAMES_LOG
const AREAS_GEOG_LEVEL_FILENAME = `${CONFIG_DIR}/geography/areas-geog-level.csv`;
const EXCLUDED_INDICATORS_PATH = `${CONFIG_DIR}/excluded-indicators.json`;
const CSV_PREPROCESS_DIR = `${RAW_DIR}/family-ess-main`


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

const manifest = loadCsvWithoutBom(MANIFEST); // equivalent to previous_file_paths
// const areas_geog_level = loadCsvWithoutBom(AREAS_GEOG_LEVEL_FILENAME);
const excludedIndicators = readJsonSync(EXCLUDED_INDICATORS_PATH);

// Throw error if new indicator files have been downloaded and need to be added to the manifest
await abortIfNewFilesExist(manifest, CSV_PREPROCESS_DIR)

// remove indicator files based on boolean in manifest (separate process to those in excluded-indicators.json)
const file_paths = manifest.filter((f) => f.include === 'Y');
// console.log(file_paths.objects())
// file_paths.print()

//////////////// single-indicator testing //////////////////////

const test_data_file = file_paths.column("filePath")[3].replace(`${CSV_PREPROCESS_DIR}`, '')
// double check that this ^ is definitely excluding those files marked N in the manifest
const test = test_data_file.replace('.csv', '')
let testmeta = JSON.parse(fs.readFileSync(`${CSV_PREPROCESS_DIR}${test}.csv-metadata.json`));
const testdata = loadCsvWithoutBom(`${CSV_PREPROCESS_DIR}${test_data_file}`)
// const transformations = testmeta.tables[0].transformations
const tableSchema = testmeta.tables[0].tableSchema.columns
// get the column titles of those columns we want to suppress
const supressedCols = tableSchema
    .filter(d => d.supressOutput)
    .map(d => d.titles[0])

//  rename the columns in data using the information in tableschema 
// (name is the target title, the first value of titles is the existing column name in the csv)
const varNames = Object.fromEntries(
    tableSchema.map(d => [d.titles[0], d.name])
)
var testdata_transformed = testdata
    .rename(varNames)

//  filter out excludedIndicators - checks whether the excluded indicator matches the full indicator name
//  entire files are excluded using the manifest
if (excludedIndicators.length) {
    testdata_transformed = testdata_transformed.filter(aq.escape(
        row =>
            !excludedIndicators.includes(row.indicator))
    );
}

// split table into one table per indicator

const indicatorTables = Object.fromEntries(
    [...new Set(testdata_transformed.array('indicator'))]
        .map(ind => [ind, testdata_transformed.filter(aq.escape(
            d => d.indicator === ind))])
);

console.log('Indicators present in data file: ', Object.keys(indicatorTables))
console.log(tableSchema)

// loop through each indicator (when more than one)
for (const [indicator, t] of Object.entries(indicatorTables)) {

    let indicatorTable = t
        // drop unused columns using metadata suppressOutput:
        .select(aq.not(supressedCols))
        // drop indicator because we don't need it as a column:
        .select(aq.not('indicator'))

    console.log(indicator)
    indicatorTable.print()

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

    // identify columns of type dimension using tableschema metadata
    // and exclude areacd and period as we want to ensure those are specified first
    let otherDimensions = tableSchema
        .filter(d => d.type === 'dimension')
        .map(d => d.name)
        .filter(d => !['areacd', 'period'].includes(d))
    console.log('There are ', otherDimensions.length, 'other dimensions additional to areacd and period: ', otherDimensions)

    // sort by each dimension (including the newly made measure, which is a dimension)
    // age is numbers as strings, so needs sorting properly. could also use Intl.collator for this
    indicatorTableLong = indicatorTableLong
        .derive({ age_sorting: aq.escape(d => parseInt(d.age)) }) // make fake age column that is numeric
        .orderby('areacd', 'period',
            ...otherDimensions.map(col => col === 'age' ? 'age_sorting' : col), // sort age using fake age column
            'measure')
        .select(aq.not('age_sorting'))

    // indicatorTableLong.print()

    // get unique values of all columns in order they appear
    const columnValues = Object.fromEntries(
        indicatorTableLong.columnNames()
            .map(c => [
                c,
                [...new Set(indicatorTableLong.array(c))]
            ])
    )

    const keys = Object.keys(columnValues).filter(k => k !== "value")
    console.log(columnValues)

    // use to construct id, size, role + dimension 

    const id = [];
    const size = [];
    const role = {};
    const dimension = {};

    const metaLookup = aq.from(tableSchema)
    metaLookup.print(11)

    for (const k of keys) {
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
        if (row.role) {
          if (!role[row.role]) role[row.role] = [];
          role[row.role].push(k);
        }
    }
}

// get shared metadata from testmeta.metadata for all arrays except the one called indicators
// get individual indicator metadata from testmeta.metadata.indicators where indicators == testdata_transformed.indicator

