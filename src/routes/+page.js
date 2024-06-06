import { base } from '$app/paths';

const metadataUrl = `${base}/config.json`;

export const load = async ({ fetch }) => {
	const metadata = await (await fetch(metadataUrl)).json();
    const indicators = Object.values(metadata.indicatorsObject).map(ind => ({
        id: ind.metadata.slug,
        label: ind.metadata.label
    }));
    const areas = metadata.areasArray.map(area => ({id: area.areacd, label: area.areanm}));
    const areaTypes = Object.keys(metadata.areasGeogLevelObject).map(key => ({
        id: Array.from(new Set(metadata.areasGeogLevelObject[key].map(cd => cd.slice(0, 3)))).join(),
        label: key
    }));
    const years = Array.from(new Set(metadata.periodsLookupArray.map(period => period.xDomainNumb))).sort((a, b) => a - b).map(yr => ({id: yr, label: yr}));

	return { indicators, areas, areaTypes, years };
};