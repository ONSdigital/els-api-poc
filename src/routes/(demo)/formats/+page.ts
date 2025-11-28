import { resolve } from '$app/paths';

export const load = async ({ fetch }) => {
	const path = resolve(`/api/v1/metadata/indicators?excludeMultivariate=true`);
	const metadata = await(await fetch(path)).json();

	return {
		metadata
	};
};