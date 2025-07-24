import { json, text } from "@sveltejs/kit";
import { csvFormat } from "d3-dsv";
import cube from "$lib/cube.json";
import metadata from "$lib/metadata.json";
// import geoGroups from "$lib/geo-groups.js";
import topics from "$lib/topics.js";

const allMeasures = ["value", "lci", "uci"];

function getParam(url, key, fallback) {
	const param = url.searchParams.get(key);
	if (!param) return fallback;
	return param.includes(",") ? param.split(",") : param;
}

// function filterCube(cube, params, measures) {
// 	measures = measures === "all" ? allMeasures : [measures].flat();

// 	const dims = [];
// 	for (const dimension of cube.dimensions) {
// 		const dim = {
// 			key: dimension.key,
// 			count: dimension.count,
// 			values: dimension.key === "xDomainNumb" ?
// 				Object.entries(dimension.values).map(v => [+v[0], v[1]]) :
// 				Object.entries(dimension.values)
// 		};
// 		if (params[dim.key] && dim.key === "areacd") dim.values = dim.values.filter(d => d[0].startsWith(params[dim.key]));
// 		else if (params[dim.key]) dim.values = dim.values.filter(d => d[0] === params[dim.key]);
// 		dims.push(dim);
// 	}
	
// 	let items;
// 	while (dims.length > 0) {
// 		const dim = dims.shift();
// 		items = !items ?
// 			dim.values.map(d => ({value: {[dim.key]: d[0]}, index: d[1]})) :
// 			items.map(item => dim.values.map(d => ({value: {...item.value, [dim.key]: d[0]}, index: (item.index * dim.count) + d[1]}))).flat();
// 	}

// 	return items.map(item => {
// 		for (const measure of measures) {
// 			item.value[measure] = cube.values[measure][item.index];
// 		}
// 		return item.value;
// 	});
// }

function filterCube(cube, params, measures) {
	measures = measures === "all" ? allMeasures : [measures].flat();

	const dims = [];
	for (const dimension of cube.dimensions) {
		const dim = {
			key: dimension.key,
			count: dimension.count,
			values: dimension.key === "date" ?
				Object.entries(dimension.values).map(v => [+v[0], v[1]]) :
				Object.entries(dimension.values)
		};
		if (params[dim.key] && dim.key === "areacd") dim.values = dim.values.filter(d => d[0].startsWith(params[dim.key]));
		else if (params[dim.key]) dim.values = dim.values.filter(d => d[0] === params[dim.key]);
		dims.push(dim);
	}

	let items = [[0]];
	for (const dim of dims) {
		const newItems = [];
		for (const item of items) {
			for (const val of dim.values) {
				newItems.push([(item[0] * dim.count) + val[1], ...item.slice(1), val[0]]);
			}
		}
		items = newItems;
	}
	
	const data = {};
	for (const col of [...dims.map(d => d.key), ...measures]) data[col] = [];
	for (const item of items) {
		for (let i = 0; i < dims.length; i ++) data[dims[i].key].push(item[i + 1]);
		for (const measure of measures) data[measure].push(cube.values[measure][item[0]]);
	}

	// for (let i = 0; i < dims.length; i ++) {
	// 	const dim = dims[i];
	// 	if (i === dims.length - 1) {
	// 		for (const item of items) {
	// 			for (const val of dim.values) {
	// 				const it = [(item[0] * dim.count) + val[1], ...item.slice(1), val[0]];
	// 				for (let j = 0; j < dims.length; j ++) data[dims[j].key].push(it[j + 1]);
	// 				for (const measure of measures) data[measure].push(cube.values[measure][it[0]]);
	// 			}
	// 		}
	// 	} else {
	// 		const newItems = [];
	// 		for (const item of items) {
	// 			for (const val of dim.values) {
	// 				newItems.push([(item[0] * dim.count) + val[1], ...item.slice(1), val[0]]);
	// 			}
	// 		}
	// 		items = newItems;
	// 	}
	// }
	return data;
}

function filterAll(data, params, measures) {
	const filtered_data = {};
	for (const key in data) {
		filtered_data[key] = filterCube(data[key], params, measures);
	}
	return filtered_data;
}

// function csvSerialise(data) {
// 	const rows = [];
// 	const keys = Object.keys(data);
// 	for (const key of keys) {
// 		const dat = data[key];
// 		for (const d of dat) rows.push({indicator: key, ...d});
// 	}
// 	return csvFormat(rows);
// }

function csvSerialise(data) {
	const rows = [];
	const keys = Object.keys(data);
	for (const key of keys) {
		const cols = Object.keys(data[key]);
		for (let i = 0; i < data[key][cols[0]].length; i ++) {
			const row = {indicator: key};
			for (const col of cols) row[col] = data[key][col][i];
			rows.push(row);
		}
	}
	return csvFormat(rows);
}

export function GET({ params, url }) {
  const format = params.format || "json";
  const topic = getParam(url, "topic", "all");
  const indicator = getParam(url, "indicator", "all");
  const geography = getParam	(url, "geography", "all");
  const time = getParam(url, "time", "latest");
  const measure = getParam(url, "measure", "all");

	let data = {...cube};

	if (topic !== "all") {
		const _data = {};
		for (const tpc of [topic].flat()) {
			const topic_ids = topics.map(t => t.id);
			if (topic_ids.includes(tpc)) {
				const ids = Object.values(metadata).filter(ind => ind.topic === tpc).map(ind => ind.code);
				for (const id of ids) _data[id] = data[id];
			}
		}
		data = _data;
	}

	if (indicator !== "all") {
		const _data = {};
		for (const ind of [indicator].flat()) {
			if (data[ind]) _data[ind] = data[ind]; 
		}
		data = _data;
	}

	const filterParams = {};
	if (geography !== "all") filterParams.areacd = geography;
	if (time !== "all") filterParams.date = +time;

	data = filterAll(data, filterParams, measure);

	if (format === "csv") data = csvSerialise(data);
	return format === "csv" ? text(data) : json(data);
}