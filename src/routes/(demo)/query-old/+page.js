import { resolve } from '$app/paths';
import geoLatestYear from "$lib/data/geo-latest-year.json";

const geoStartYear = 1992;
const years = [
  ...Array(geoLatestYear - geoStartYear + 1).keys()
].map(i => i + geoStartYear);

export const load = async ({ fetch }) => {
  const path = resolve("/api/v1/metadata/taxonomy?flat=true");
	const indicators = await(await fetch(path)).json();

	return {
		indicators,
    years
	};
};