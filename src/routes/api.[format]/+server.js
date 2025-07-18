import { json, text, error } from "@sveltejs/kit";
import { csvFormat } from "d3-dsv";
import cache from "./cache.js";
import raw_data from "$lib/data.json";
import metadata from "$lib/metadata.json";
import geoGroups from "$lib/geo-groups.js";
import topics from "$lib/topics.js";

const columns = ["areacd", "date", "value", "lci", "uci"];

function removeKeys(data, measure = "all") {
	const stripped_data = {};
	const cols = measure === "all" ? columns.slice(-3) : [measure].flat();
	for (const indicator in data) {
		const obj = {
			areacd: data[indicator].areacd,
			date: data[indicator].xDomainNumb
		};
		for (const col of cols) if (data[indicator][col]) obj[col] = data[indicator][col];
		stripped_data[indicator] = obj;
	}
	return stripped_data;
}

function getParam(url, key, fallback) {
	const param = url.searchParams.get(key);
	if (!param) return fallback;
	return param.includes(",") ? param.split(",") : param;
}

function makeGeoMatch(filters) {
	if (!filters) return null;
	return filters.prefix.size > 0 && filters.single.size > 0 ?
		(geo) => filters.prefix.has(geo.slice(0, 3)) || filters.single.has(geo) :
		filters.prefix.size > 0 ? (geo) => filters.prefix.has(geo.slice(0, 3)) :
		filters.single.size > 0 ? (geo) => filters.single.has(geo) :
		null;
}

function makeDateMatch(filter, indicator) {
	if (!filter) return null;
	const xMin = metadata[indicator].minXDomainNumb;
	const xMax = metadata[indicator].maxXDomainNumb;

	let dateMatch;
	if (filter.type === "single") {
		const year = filter.year === "earliest" || (filter.mode === "earliest" && filter.year < xMin) ? xMin :
			filter.year === "latest" || (filter.mode === "latest" && filter.year > xMax) ? xMax :
			filter.year;
		dateMatch = (date) => date === year;
	} else {
		const start = filter.start === "earliest" || filter.earliest && filter.start < xMin ? xMin : filter.start;
		const end = filter.end === "latest" || filter.latest && filter.end > xMax ? xMax : filter.end;
		dateMatch = (date) => date >= start && date <= end;
	}
	return dateMatch;
}

function filterDataset(data, geoMatch, dateMatch) {
	const rowFilter = geoMatch && dateMatch ? (i) => geoMatch(data.areacd[i]) && dateMatch(data.date[i]) :
		geoMatch ? (i) => geoMatch(data.areacd[i]) :
		dateMatch ? (i) => dateMatch(data.date[i]) :
		null;
	if (!geoMatch && !dateMatch) return data;

	const filtered_data = {};
	const cols = Object.keys(data);

	for (const col of cols) filtered_data[col] = [];
	for (let i = 0; i < data[cols[0]].length; i ++) {
		if (rowFilter(i)) {
			for (const col of cols) filtered_data[col].push(data[col][i]);
		}
	}
	return filtered_data;
}

function filterAll(data, geoFilter, timeFilter) {
	const filtered_data = {};
	const geoMatch = makeGeoMatch(geoFilter);
	for (const key in data) {
		const dateMatch = makeDateMatch(timeFilter, key);
		filtered_data[key] = filterDataset(data[key], geoMatch, dateMatch);
	};
	return filtered_data;
}

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

	const cacheKey = url.href;
	const cachedValue = cache.get(cacheKey);
	// const cachedValue = null;
	if (cachedValue) return format === "csv" ? text(cachedValue) : json(cachedValue);

  const topic = getParam(url, "topic", "all");
  const indicator = getParam(url, "indicator", "all");
  const geography = getParam	(url, "geography", "all");
  const time = getParam(url, "time", "latest");
  const measure = getParam(url, "measure", "all");

  let data = removeKeys(raw_data.combinedDataObjectColumnOriented, measure);

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
	if (Object.keys(data).length === 0) return error(500, "Topic parameter returned no datasets");

	if (indicator !== "all") {
		const _data = {};
		for (const ind of [indicator].flat()) {
			if (data[ind]) _data[ind] = data[ind]; 
		}
		data = _data;
	}
	if (Object.keys(data).length === 0) return error(500, "Indicator parameter returned no datasets");

	let geoFilter;
	if (geography !== "all") {
		geoFilter = {single: new Set(), prefix: new Set()};
		for (const geo of [geography].flat()) {
			if (geo.match(/[EKNSW]\d{8}/)) {
				geoFilter.single.add(geo);
			} else if (geo.match(/[EKNSW]\d{2}/)) {
				geoFilter.prefix.add(geo);
			} else if (geoGroups[geo]) {
				for (const cd of geoGroups[geo].codes) geoFilter.prefix.add(cd);
			}
		}
	}

	let timeFilter;
	if (time !== "all") {
		if (time.includes("-")) {
			const range = time.split("-");
			const start = +range[0].slice(0, 4);
			const earliest = range[0].slice(4) === "earliest";
			const end = +range[1].slice(0, 4);
			const latest = range[1].slice(4) === "latest";
			timeFilter = {
				type: "range",
				start: Number.isNaN(start) ? null : start,
				end: Number.isNaN(end) ? null : end,
				earliest,
				latest
			};
		} else if (typeof time === "string") {
			const year = +time.slice(0, 4);
			const mode = time.slice(4) || "exact";
			timeFilter = {
				type: "single",
				year: Number.isNaN(year) ? time : year,
				mode
			};
		}
	}
	
	if (timeFilter || geoFilter) data = filterAll(data, geoFilter, timeFilter);

	if (format === "csv") data = csvSerialise(data);
	cache.set(cacheKey, data);

	return format === "csv" ? text(data) : json(data);
}