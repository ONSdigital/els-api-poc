import { csvFormat } from "d3-dsv";
import readData from "$lib/data";

const geoLookup = await readData("geo-metadata");

// Makes a code => name lookup from an array of GSS codes
function makeAreaLookup(codes) {
	return Object.fromEntries(codes.map(cd => [cd, geoLookup[cd]?.areanm]));
}

// Map an array of dimension values to their corresponding labels
function dimValuesToLabels(dim, cube) {
	if (cube.dimension[dim.key].category.label)
		dim.values = dim.values.map(v => [cube.dimension[dim.key].category.label[v[0]], v[1]]);
}

// Take filtered dims and expand to array of all the values they represent
export function dimsToItems(dims, cube) {
	let items = [[0]];
	for (const dim of dims) {
		dimValuesToLabels(dim, cube);
		const newItems = [];
		for (const item of items) {
			for (const val of dim.values) {
				newItems.push([(item[0] * dim.count) + val[1], ...item.slice(1), val[0]]);
			}
		}
		items = newItems;
	}
	return items;
}

// Take filtered dims and use them to return a filtered JSON-Stat dataset
export function toJSONStat(qb, dims, includeNames = false, includeStatus = false) {
	const cube = {};
	for (const key of Object.keys(qb).filter(key => !["value", "status"].includes(key))) cube[key] = structuredClone(qb[key]);

	let indices = [0];

	for (let i = 0; i < dims.length; i ++) {
		const dim = dims[i];
		const size = dim.values.length;

		if (dim.values.length !== 1) {
			const newIndices = [];
			// const newIndices = Array(indices.length * size);
			// let j = 0;
			for (const index of indices) {
				for (const val of dim.values) {
					newIndices.push((index * dim.count) + val[1]);
					// newIndices[j] = (index * dim.count) + val[1];
					// j ++;
				}
			}
			indices = newIndices;
			// indices = indices.flatMap(index => dim.values.map(val => (index * dim.count) + val[1]));
		}

		cube.dimension[dim.key].category.index = Object.fromEntries(dim.values.map((val, i) => [val[0], i]));
		if (cube.dimension[dim.key].category.label && size < cube.size[i]) {
			const label = {};
			for (const val of dim.values) label[val[1]] = qb.dimension[dim.key].category.label[val[1]];
			cube.dimension[dim.key].category.label = label;
		}
		cube.size[i] = size;
		if (includeNames) cube.dimension.areacd.category.label = makeAreaLookup(Object.keys(cube.dimension.areacd.category.index));
	}

	const value = Array(indices.length).fill(null);

	if (includeStatus) {
		cube.status = {};
		for (let i = 0; i < indices.length; i ++) {
			value[i] = qb.value[indices[i]];
			if (qb.status[indices[i]]) cube.status[indices[i]] = qb.status[indices[i]];
		}
	} else {
		for (let i = 0; i < indices.length; i ++) {
			value[i] = qb.value[indices[i]];
		}
	}

	cube.value = value;
	
	return cube;
}

// Get the primary key/column for values in the dataset
function getValueKey(measures) {
	if (!measures) return "value";
	const keys = measures.values.map(val => val?.[0]);
	return keys.includes("value") ? "value" : keys?.[0];
}

// This bulky function runs once to generate the most minimal col function based on the selected params
// This saves a number of condiditional tests for each individual row added
function makeColFill(includeNames, includeStatus, measures = null) {
	const measuresCount = measures?.count || 1;
	const pushMeasures = ((measures) => {
		return measures ? (data, item, cube) => {
			for (let j = 0; j < measures.values.length; j ++) {
				data[measures.values[j][0]].push(cube.value[(item[0] * measuresCount) + measures.values[j][1]]);
			}
		} : (data, item, cube) => data.value.push(cube.value[item[0]]);
	})(measures);
	const pushVals = (data, item, dims, cube) => {
		for (let i = 0; i < dims.length - 1; i ++) data[dims[i].key].push(item[i + 1]);
		pushMeasures(data, item, cube);
	}
	const pushName = (data, item) => data.areanm.push(geoLookup[item[1]]?.areanm || null);
	const pushStatus = (data, item, cube) => data.status.push(cube.status[item[0] * measuresCount] || null);

	return includeNames && includeStatus ? (data, item, dims, cube) => {
		pushVals(data, item, dims, cube);
		pushName(data, item);
		pushStatus(data, item, cube);
	} : includeNames ? (data, item, dims, cube) => {
		pushVals(data, item, dims, cube);
		pushName(data, item);
	} : includeStatus ? (data, item, dims, cube) => {
		pushVals(data, item, dims, cube);
		pushStatus(data, item, cube);
	} : pushVals;
}

function filterCols(data, valueKey, includeStatus = false) {
	const filteredData = {};
	const cols = Object.keys(data);

	for (const key of cols) filteredData[key] = [];

	const hasData = includeStatus ? (i) => data[valueKey][i] || data.status[i] : (i) => data[valueKey][i];
	const count = data[valueKey].length;
	for (let i = 0; i < count; i ++) {
		if (hasData(i)) {
			for (const key of cols) filteredData[key].push(data[key][i]);
		}
	}
	return filteredData;
}

export function itemsToCols(cube, dims, items, measures, includeNames = false, includeStatus = false) {
	const data = {};
	for (const dim of dims.slice(0, -1)) {
		data[dim.key] = [];
		if (includeNames && dim.key === "areacd") data.areanm = [];
	};
	for (const val of measures.values) data[val[0]] = [];
	const colFill = makeColFill(includeNames, includeStatus, measures);
	if (includeStatus) data.status = [];
	for (const item of items) {
		colFill(data, item, dims, cube);
	}
	return filterCols(data, getValueKey(measures), includeStatus);
}

export function toCols(cube, dims, includeNames, includeStatus) {
	const measures = dims[dims.length - 1];

	const items = dimsToItems(dims.slice(0, -1), cube);
	const data = itemsToCols(cube, dims, items, measures, includeNames, includeStatus);

	return [cube.extension.slug, data];
}

function colsToRows(cols, indicator = null) {
	indicator = indicator ? {indicator} : null
	
	const rows = [];
	
	const colKeys = Object.keys(cols);
	const makeRow = (i) => {
		const row = {...indicator};
		for (const key of colKeys) row[key] = cols[key][i];
		return row;
	}

	const count = cols[colKeys[0]].length;
	for (let i = 0; i < count; i ++) {
		rows.push(makeRow(i));
	}
	return rows;
}

export function toRows(cube, dims, includeIndicator, includeNames, includeStatus) {
	const measures = dims[dims.length - 1];
	if (measures.values.length === 0) return [];

	const items = dimsToItems(dims.slice(0, -1), cube);
	const cols = itemsToCols(cube, dims, items, measures, includeNames, includeStatus);
	const rows = colsToRows(cols, includeIndicator ? cube.label : null);

	return [cube.extension.slug, rows];
}

// Infer columns from row data
function inferColumns(rows) {
  const cols = new Set();
	for (const row of rows) {
		for (const col in row) cols.add(col);
	}
	return Array.from(cols);
}

// Sort order of columns for CSV output
function sortColumns(cols) {
	return cols.includes("status") ? [...cols.filter(col => col !== "status"), "status"] : cols
}

export function csvSerialise(datasets) {
	const rows = datasets.flat();
	const cols = sortColumns(inferColumns(rows));
	return csvFormat(rows, cols);
}

function getDimColumns(datasets) {
	const cols = {};
	for (const ds of datasets) {
		const keys = ds.id.slice(0, -1);
		for (const key of keys) {
			cols[key] = {
				name: key,
				titles: ds.dimension[key].label || key,
				datatype: key === "period" ? "date" : "string"
			};
		}
	}
	return Object.values(cols);
}

function getMeasureColumns(datasets, measure) {
	const filter = [measure].flat();
	const cols = {};
	for (const ds of datasets) {
		const cat = ds.dimension.measure.category;
		for (const key in cat.index) {
			if (filter[0] === "all" || filter.includes(key)) 
				cols[key] = {name: key, titles: cat.label[key], datatype: "number"};
		}
	}
	return Object.values(cols);
}

function makeCSVWColumns(datasets, measure, singleIndicator, includeNames, includeStatus) {
	const cols = [{
		name: "indicator",
		titles: "Indicator",
		datatype: "string"
	}];
	cols.push(...getDimColumns(datasets));
	cols.push(...getMeasureColumns(datasets, measure));
	if (includeNames) cols.splice(2, 0, {
		name: "areanm",
		titles: "Area name",
		datatype: "string"
	});
	if (includeStatus) cols.push({
		name: "status",
		titles: "Status",
		datatype: "string"
	});
	if (singleIndicator) cols.shift();
	return cols;
}

export function toCSVW(datasets, measure, href, singleIndicator, includeNames = false, includeStatus = false) {
	const dateString = (new Date()).toISOString().slice(0, 10);
	let metadata = {
		"@context": ["http://www.w3.org/ns/csvw", {"@language": "en"}],
		url: href.replace(".csvw", ".csv"),
		"rdfs:label": `Combined datasets retrieved from Explore Local Statistics on ${dateString}`,
	}
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
			"dc:issued": ds.updated
		}
	}
	metadata.tatableSchema = {
		columns: makeCSVWColumns(datasets, measure, singleIndicator, includeNames, includeStatus)
	};
	return metadata;
}