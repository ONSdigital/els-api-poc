import { resolve } from '$app/paths';

export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
  const path = resolve("/api/v1/geo/list?year=all&asLookup=true&includeDates=true");
	const areaLookup = await(await fetch(path)).json();

	return {
		areaLookup
	};
};
