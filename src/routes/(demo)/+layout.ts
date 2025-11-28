import { resolve } from '$app/paths';

export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
  const pathLookup = resolve("/api/v1/geo/list?year=all&asLookup=true&includeDates=true");
	const areaLookup = await(await fetch(pathLookup)).json();

	const pathList = resolve(`/api/v1/geo/list?geo=ltla`);
	const areaList = await(await fetch(pathList)).json();

	return {
		areaLookup,
		areaList: [...areaList].sort((a, b) => a.areanm.localeCompare(b.areanm))
	};
};
