import { resolve } from '$app/paths';
import { getParam, isValidPostcode } from "$lib/api/utils.js";

export const load = async ({ url, fetch }) => {
	const query = getParam(url, "q", "");
	if (!query) return  {meta: { query, count: 0 }, data: []};

	try {
		if (isValidPostcode(query.toUpperCase())) {
			const path = resolve(`/api/v1/geo/postcodes/${query}?groupByLevel=true`);
			const result = await(await fetch(path)).json();
			if (result.message) throw Error();
			return result;
		} else {
			const path = resolve(`/api/v1/geo/search/${query}?groupByLevel=true`);
			const result = await(await fetch(path)).json();
			if (result.message) throw Error();
			return result;
		}
	} catch(err) {
		return {meta: { query, count: 0 }, data: []};
	}
};
