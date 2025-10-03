import { resolve } from '$app/paths';

export const load = async ({ fetch }) => {
  const path = resolve("/api/v1/metadata/taxonomy");
	const taxonomy = await(await fetch(path)).json();

	return {
		taxonomy
	};
};
