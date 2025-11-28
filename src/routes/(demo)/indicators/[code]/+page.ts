import { resolve } from '$app/paths';

export const load = async ({ params, fetch }) => {
  const path = resolve(`/api/v1/metadata/indicators/${params.code}`);
	const indicator = await(await fetch(path)).json();

	return {
		indicator
	};
};
