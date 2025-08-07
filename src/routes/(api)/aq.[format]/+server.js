import { text } from "@sveltejs/kit";
import { op } from "arquero";
import table from "./table.js"
import metadata from "$lib/metadata.json";
import geoGroups from "$lib/geo-groups.js";
import topics from "$lib/topics.js";

function getParam(url, key, fallback) {
	const param = url.searchParams.get(key);
	if (!param) return fallback;
	return param.includes(",") ? param.split(",") : param;
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

function makeAqueroFilter(indicatorFilter, geoFilter, timeFilter) {
	if (!indicatorFilter && !geoFilter && !timeFilter) return null;
	if (indicatorFilter && geoFilter && timeFilter) return (d, $) => op.has($.indicatorFilter, d.indicator) && op.has($.geoFilter, d.areacd) && op.equal(d.date, $.timeFilter);
	if (indicatorFilter && geoFilter) return (d, $) => op.has($.indicatorFilter, d.indicator) && op.has($.geoFilter, d.areacd);
	if (indicatorFilter && timeFilter) return (d, $) => op.has($.indicatorFilter, d.indicator) && op.equal(d.date, $.timeFilter)
	if (geoFilter && timeFilter) return (d, $) => op.has($.geoFilter, d.areacd) && op.equal(d.date, $.timeFilter);
	if (indicatorFilter) return (d, $) => op.has($.indicatorFilter, d.indicator);
	if (geoFilter) return (d, $) => op.has($.geoFilter, d.areacd);
	return (d, $) => op.equal(d.date, $.timeFilter);
}

export function GET({ params, url }) {
  const format = params.format || "json";
  const topic = getParam(url, "topic", "all");
  const indicator = getParam(url, "indicator", "all");
  const geography = getParam	(url, "geography", "all");
  const time = getParam(url, "time", "latest");
  // const measure = getParam(url, "measure", "all");

	let indicatorFilter;
	if (topic !== "all") {
		indicatorFilter = new Set();
		const topic_ids = topics.map(t => t.id);
		for (const tpc of [topic].flat()) {
			if (topic_ids.includes(tpc)) {
				const indicators = Object.values(metadata).filter(ind => ind.topic === tpc).map(ind => ind.code);
				for (const ind of indicators) indicatorFilter.add(ind);
			}
		}
	}

	if (indicator !== "all") {
		if (!indicatorFilter) indicatorFilter = new Set();
		for (const ind of [indicator].flat()) {
			indicatorFilter.add(ind); 
		}
	}

	let geoFilter;
	if (geography !== "all") {
		geoFilter = new Set();
		for (const geo of [geography].flat()) {
			if (geo.match(/[EKNSW]\d{2}/)) {
				geoFilter.add(geo);
			} else if (geoGroups[geo]) {
				for (const cd of geoGroups[geo].codes) geoFilter.add(cd);
			}
		}
	}

	let timeFilter;
	if (time.match(/\d{4}/)) {
		timeFilter = +time;
	}
	// if (time !== "all") {
	// 	if (time.includes("-")) {
	// 		const range = time.split("-");
	// 		const start = +range[0].slice(0, 4);
	// 		const earliest = range[0].slice(4) === "earliest";
	// 		const end = +range[1].slice(0, 4);
	// 		const latest = range[1].slice(4) === "latest";
	// 		timeFilter = {
	// 			type: "range",
	// 			start: Number.isNaN(start) ? null : start,
	// 			end: Number.isNaN(end) ? null : end,
	// 			earliest,
	// 			latest
	// 		};
	// 	} else if (typeof time === "string") {
	// 		const year = +time.slice(0, 4);
	// 		const mode = time.slice(4) || "exact";
	// 		timeFilter = {
	// 			type: "single",
	// 			year: Number.isNaN(year) ? time : year,
	// 			mode
	// 		};
	// 	}
	// }
	
	const filterFn = makeAqueroFilter(indicatorFilter, geoFilter, timeFilter);

	const filtered_table = filterFn ? table.params({indicatorFilter, geoFilter, timeFilter}).filter(filterFn) : table;

	return format === "csv" ? text(filtered_table.toCSV()) : text(filtered_table.toJSON());
}