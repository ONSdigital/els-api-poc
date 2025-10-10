import { resolve } from '$app/paths';
import { getParam, isValidPostcode } from "$lib/api/utils.js";

export const load = async ({ url, fetch }) => {
	const query = getParam(url, "q", "");
	if (!query) return {query, areas: []};

	try {
		if (isValidPostcode(query.toUpperCase())) {
			const path = resolve(`/api/v1/geo/postcodes/${query}?groupByLevel=true`);
			const result = await(await fetch(path)).json();
			return {query: result.areacd, areas: result.areas};
		} else {
			const path = resolve(`/api/v1/geo/search/${query}?groupByLevel=true`);
			const result = await(await fetch(path)).json();
			return {query, areas: result};
		}
	} catch(err) {
		console.log(err);
		return {query, areas: []};
	}
};
