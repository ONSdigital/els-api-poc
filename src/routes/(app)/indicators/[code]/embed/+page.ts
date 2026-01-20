import type { PageLoad } from './$types';
import { error } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { getParam } from '$lib/api/utils';
import { isValidChartType } from '$lib/util/validationHelpers';
import { makeDataUrl } from '$lib/utils';

export const load: PageLoad = async ({ fetch, params, url }) => {
	const chart = getParam(url, "type", null);
	const geo = getParam(url, "geo", null);
	const areas = getParam(url, "areas", null);
	const years = getParam(url, "years", null);
	const intervals = getParam(url, "intervals", false);
	// const related = getParam(url, "related", null);
	// const relatedLabel = getParam(url, "related_label", null);

	if (!isValidChartType(chart)) error(400, { message: "Invalid chart type" });

	const metaUrl = resolve(`/api/v1/metadata/indicators/${params.code}`);
	const dataUrl = makeDataUrl(
		params.code,
		years ? String(years).replace("-", ",") : "",
		Array.isArray(years) ? "none" : "latest",
		areas ? [areas].flat() : [],
		geo,
		null,
		null
	);

	try {
		const indicator = await (await fetch(metaUrl)).json();
		const data = await (await fetch(dataUrl)).json();

		return { indicator, data, chart, intervals };
	} catch {
		error(404, { message: "Selected data indicator not found." });
	}
};
