import { resolve } from '$app/paths';

export const load = async ({ fetch }) => {

	const pathList = resolve(`/api/v1/geo/list?geo=ltla&year=2023`);
	const areaList = await(await fetch(pathList)).json();

	return {
		areaList2023: [...areaList].sort((a, b) => a.areanm.localeCompare(b.areanm))
	};
};
