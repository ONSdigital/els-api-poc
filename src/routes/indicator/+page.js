import { resolve } from '$app/paths';

export const prerender = false;
export const trailingSlash = 'always';

export const load = async ({ fetch }) => {
  const exclude = ["population-by-age-and-sex"];

	const path = resolve(`/api/v1/metadata/taxonomy?flat=true`);
	const indicators = await(await fetch(path)).json();

	return {
		indicators: indicators.filter(ind => !exclude.includes(ind.key))
	};
};