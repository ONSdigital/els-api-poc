import { resolve } from '$app/paths';

export const load = async ({ fetch }) => {
  const exclude = ["population-by-age-and-sex"];

	const path = resolve(`/api/v1/metadata/indicators`);
	const metadata = await(await fetch(path)).json();

	return {
		metadata: metadata.filter(meta => !exclude.includes(meta.slug))
	};
};