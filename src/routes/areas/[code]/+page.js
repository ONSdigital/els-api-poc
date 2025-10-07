import { resolve } from '$app/paths';

export const load = async ({ params, fetch }) => {
  const areaPath = resolve(`/api/v1/geo/lookup/${params.code}`);
	const area = await(await fetch(areaPath)).json();

	const relatedPath = resolve(`/api/v1/geo/related/${params.code}`);
	const related = await(await fetch(relatedPath)).json();

	return {
		area,
		related
	};
};
