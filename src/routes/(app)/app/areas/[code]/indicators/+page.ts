import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import summaryData from "$lib/data/json-stat-summary.json";
import { geoLevels, geoLevelsLookup } from "$lib/config/geo-levels.js";
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { area } = await parent();
	const geoLevel = geoLevelsLookup[area.properties.areacd.slice(0, 3)].key;
  const parentLevel = geoLevels[["ctry", "rgn"].includes(geoLevel) ? "ctry" : "rgn"];
	const areaParent = area.properties.parents.find(p => parentLevel.codes.includes(p.areacd.slice(0, 3)));

	const taxonomyPath = resolve(`/api/v1/metadata/taxonomy?hasGeo=${params.code}&excludeMultivariate=true`);
	const metadataPath = resolve(`/api/v1/metadata/indicators?hasGeo=${params.code}&excludeMultivariate=true&asLookup=true`);
	const areasPath = resolve(`/api/v1/geo/list?year=latest`);

	try {
		const taxonomy = await(await fetch(taxonomyPath)).json();
		const metadata = await(await fetch(metadataPath)).json();
		const areas = [...await(await fetch(areasPath)).json()].sort((a, b) => a.areanm.localeCompare(b.areanm));

		return {
			taxonomy,
			metadata,
			areas,
			parent: areaParent,
			periods: summaryData.years
		};
	} catch {
		error(404, { message: 'Could not retrieve metadata' });
	}
}
