// import { error } from '@sveltejs/kit';
import fs from 'fs';
import csv from 'csv-parser';
import { csvFormat } from 'd3-dsv';

const dataUrl = './static/datasets.csv';

function fillYears(year) {
    const years = year.split('-').map(yr => +yr);
    if (years.length === 2 && years[1] > years[0]) {
        const newyears = [years[0]];
        while (newyears[newyears.length - 1] < years[1]) {
            newyears.push(newyears[newyears.length - 1] + 1);
        }
        return newyears.map(yr => String(yr));
    }
    return years.map(yr => String(yr));
}

function makeFilter(params = {}) {
    const conditions = [];
    const indicator = params.indicator ? params.indicator.split(',') : null;
    const geography = params.geography ? params.geography.split(',').filter(geo => geo.length === 9) : null;
    const geoType = params.geography ? params.geography.split(',').filter(geo => geo.length === 3) : null;
    const year = params.year ? params.year.split(',').map(yr => fillYears(yr)).flat().filter(yr => yr.length === 4 && typeof +yr === 'number') : null;

    if (indicator && indicator.length > 1) conditions.push(`${JSON.stringify(indicator)}.includes(data.indicator)`);
    else if (indicator) conditions.push(`data.indicator === '${indicator[0]}'`);

    let geoRule = [];
    if (geography?.length > 1) geoRule.push(`${JSON.stringify(geography)}.includes(data.areacd)`);
    else if (geography?.length > 0) geoRule.push(`data.areacd === '${geography[0]}'`);
    if (geoType?.length > 1) geoRule.push(`${JSON.stringify(geoType)}.includes(data.areacd.slice(0, 3))`);
    else if (geoType?.length > 0) geoRule.push(`data.areacd.slice(0, 3) === '${geoType[0]}'`);
    if (geoRule.length === 2) conditions.push(`(${geoRule.join(' || ')})`);
    else if (geoRule.length === 1) conditions.push(geoRule);

    if (year && year.length > 1) conditions.push(`${JSON.stringify(year)}.includes(data.year)`);
    else if (year) conditions.push(`data.year === '${year[0]}'`);

    return `(data) => {${conditions.length > 0 ? `if (${conditions.join(' && ')}) ` : ''}results.push(data)}`;
}

function filterData(params = {}) {
    return new Promise((resolve) => {
        const results = [];
        const filterStr = makeFilter(params);
        // console.log(filterStr);

        // IMPORTANT: use of eval() here is highly risky!
        // The purpose is to optimise the filter function as much as possible
        // This function gets run on EVERY row of the raw data
        // Need to consider alternatives
        const filterFn = eval(filterStr);

        fs.createReadStream(dataUrl)
            .pipe(csv())
            .on('data', filterFn)
            .on('end', () => {
                resolve(results);
            });
    });
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const indicator = url.searchParams.get('indicator') ?? null;
    const geography = url.searchParams.get('geography') ?? null;
    const year = url.searchParams.get('year') ?? null;
    const columns = url.searchParams.get('columns') ?? null;

    const results = await filterData({indicator, geography, year});

    const response = new Response(
        columns ? csvFormat(results, columns.split(',')) : csvFormat(results),
        { headers: new Headers({'content-type': 'text/csv'})}
    );

    return response;
}