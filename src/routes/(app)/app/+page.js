import { resolve } from '$app/paths';

export const load = async ({ fetch }) => {
  const path = resolve("/api/v1/metadata/taxonomy");
	const taxonomy = await(await fetch(path)).json();

    const pathFlat = resolve("/api/v1/metadata/taxonomy?flat=true");
    const taxonomyFlat = await(await fetch(pathFlat)).json()

	return {
		taxonomy,
    taxonomyFlat
	};
};