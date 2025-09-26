import { json, error } from "@sveltejs/kit";
import raw_data from "$lib/data/data.json";
import metadata from "$lib/data/metadata.json";
import { geoLevels } from "$lib/config/geo-levels.js";
import topics from "$lib/config/topics.js";

const keys = ["areacd", "date", "value", "lci", "uci"];

function removeKeys(data) {
	const stripped_data = {};
	for (const indicator in data) {
		stripped_data[indicator] = {
			areacd: data[indicator].areacd,
			date: data[indicator].xDomainNumb,
			value: data[indicator].value,
			lci: data[indicator].lci,
			uci: data[indicator].uci
		};
	}
	return stripped_data;
}

function filterData(key, value) {
	return function(data, indicator = null) {
		const filtered_data = {};
		for (const k of keys) filtered_data[k] = [];

		let _value = value;
		if (indicator && typeof value === "number")
			_value = value > metadata[indicator].maxXDomainNumb ?
				metadata[indicator].maxXDomainNumb : value;
		for (let i = 0; i < data.areacd.length; i ++) {
			if (data[key][i] === _value) {
				for (const k of keys) filtered_data[k].push(data[k][i]);
			}
		}
		return filtered_data;
	}
}

function filterMeasure(key) {
	return function(data) {
		const stripped_data = {};
		for (const k of [...keys.slice(0, 2), key]) stripped_data[k] = data[k];
		return stripped_data;
	}
}

function filterPrefixes(key, prefixes) {
	return function(data) {
		const filtered_data = {};
		for (const k of keys) filtered_data[k] = [];
		for (let i = 0; i < data.areacd.length; i ++) {
			if (prefixes.some(prefix => data[key][i].startsWith(prefix))) {
				for (const k of keys) filtered_data[k].push(data[k][i]);
			}
		}
		return filtered_data;
	}
}

function filterAll(data, filter) {
	const filtered_data = {};
	for (const key in data) filtered_data[key] = filter(data[key], key);
	return filtered_data;
}

export function GET({ params }) {
	let data = removeKeys(raw_data.combinedDataObjectColumnOriented);

	if (params.topic !== "all") {
		if (topics.map(t => t.id).includes(params.topic)) {
			const ids = Object.values(metadata).filter(ind => ind.topic === params.topic).map(ind => ind.code);
			const _data = {};
			for (const id of ids) _data[id] = data[id];
			data = _data;
		} else data = data[params.topic];
		if (data.areacd) data = {[params.topic]: data};
	}
	if (!data) return error(500, "Request failed on topic parameter");

	if (params.geography !== "all") {
		if (params.geography.match(/[EKNSW]\d{8}/)) {
			data = filterAll(data, filterData("areacd", params.geography));
		} else if (params.geography.match(/[EKNSW]\d{2}/) || geoLevels[params.geography]) {
			const codes = geoLevels[params.geography].codes || [params.geography];
			data = filterAll(data, filterPrefixes("areacd", codes));
		} else data = null;
	}
	if (!data) return error(500, "Request failed on geography parameter");

	if (params.time_period !== "all") {
		const year = +params.time_period;
		data = filterAll(data, filterData("date", year));
	}
	if (!data) return error(500, "Request failed on time period parameter");

	if (params.measure !== "all") {
		data = filterAll(data, filterMeasure(params.measure));
	}
	if (!data) return error(500, "Request failed on measure parameter");

	return json(data);
}