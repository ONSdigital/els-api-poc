import { error, redirect } from '@sveltejs/kit';
import { base, resolve } from '$app/paths';
import type { LayoutLoad } from './$types';
import { getName } from '@onsvisual/robo-utils';
import { Breadcrumb } from '@onsvisual/svelte-components';

export const load: LayoutLoad = async ({ params, fetch }) => {

  if (params.code.kind === 'Failure') {
		error(404, { message: 'Invalid area code' });
	}
    const areaPath = resolve(`/api/v1/geo/lookup/${params.code}`);
    const area = await(await fetch(areaPath)).json();
  
    const relatedPath = resolve(`/api/v1/geo/related/${params.code}`);
    const related = await(await fetch(relatedPath)).json();
  
    return {
      area,
      related
    };
	

	// const result = await getArea(fetch, code.type, code.value);

	// if (result.kind === 'Failure') {
	// 	if (result.status === 404) {
	// 		error(404, { message: 'Page not found' });
	// 	} else {
	// 		error(500, { message: 'Sorry, there was an error with this page' });
	// 	}
	// } else {
	// 	const canonicalSlug = makeCanonicalSlug(result.place.areacd, result.place.areanm);

	// 	if (params.code !== canonicalSlug) {
	// 		redirect(301, canonicalSlug);
	// 	}

		return {
			area,
	// 		links: productLinks.map(addBaseUrlsToProductLink),
	// 		title: `${getName(result.place)} (${result.place.areacd}) - ONS`,
	// 		description: `Find facts and figures from across the ONS on ${getName(result.place, 'the')} (${result.place.typenm}).`,
	// 		pageType: `area page`,
	// 		component: Breadcrumb,
	// 		breadcrumbLinks: [
	// 			{ label: 'Home', href: `/`, refresh: true },
	// 			{ label: 'Explore local statistics', href: `${base}/` },
	// 			...[...result.place.parents]
	// 				.reverse()
	// 				.map((p) => ({ label: getName(p), href: `${base}/areas/${p.areacd}` })),
	// 			{ label: getName(result.place) }
	// 		],
	// 		background: '#fff'
	// 	};
	}

};

const addBaseUrlsToProductLink = (link: (typeof productLinks)[0]) => ({
	...link,
	url: link.url.startsWith('/') ? base + link.url : link.url,
	image: link.image.startsWith('/') ? base + link.image : link.image
});