import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import summaryData from "$lib/data/json-stat-summary.json";
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, fetch }) => {
	const taxonomyPath = resolve(`/api/v1/metadata/taxonomy?hasGeo=${params.code}&excludeMultivariate=true`);
	const metadataPath = resolve(`/api/v1/metadata/indicators?hasGeo=${params.code}&excludeMultivariate=true&asLookup=true`);

	try {
		const taxonomy = await(await fetch(taxonomyPath)).json();
		const metadata = await(await fetch(metadataPath)).json();

		return {
			taxonomy,
			metadata,
			periods: summaryData.years
		};
	} catch {
		error(404, { message: 'Could not retrieve metadata' });
	}
}
