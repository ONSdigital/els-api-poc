import { resolve } from "$app/paths";
import { geoLevels } from "$lib/config/geo-levels.js";

export const load = async ({ fetch }) => {
  const metadataPath = resolve(
    "/api/v1/metadata/indicators/gross-disposable-household-income-per-head?fullDims=true"
  );
  const areasPath = resolve(
    "/api/v1/geo/list?indicator=gross-disposable-household-income-per-head&year=all"
  );

  const metadata = await (await fetch(metadataPath)).json();
  const areas = (await (await fetch(areasPath)).json())
    .sort((a, b) => a.areanm.localeCompare(b.areanm));
  const gLevels = metadata.geography.levels.map(id => ({id, ...geoLevels[id]}));
	const periods = Object.keys(metadata.dimensions[1].category.index);

  return {
    metadata,
		areas,
    geoLevels: gLevels,
		periods
  };
};
