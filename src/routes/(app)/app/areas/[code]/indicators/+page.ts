import { error } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { pluralise, formatName } from "@onsvisual/robo-utils";
import summaryData from "$lib/data/json-stat-summary.json";
import { geoLevels, geoLevelsLookup } from "$lib/config/geo-levels.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent, fetch }) => {
  const { area } = await parent();
  const geoLevel = geoLevelsLookup[area.properties.areacd.slice(0, 3)];
  const parentLevel =
    geoLevels[["ctry", "rgn"].includes(geoLevel?.key) ? "ctry" : "rgn"];
  const areaParent = area.properties.parents.find((p) =>
    parentLevel.codes.includes(p.areacd.slice(0, 3))
  );

  const taxonomyPath = resolve(
    `/api/v1/metadata/taxonomy?hasGeo=${params.code}&excludeMultivariate=true`
  );
  const metadataPath = resolve(
    `/api/v1/metadata/indicators?hasGeo=${params.code}&excludeMultivariate=true&asLookup=true`
  );
  const areasPath = resolve(`/api/v1/geo/list?year=latest`);
  const relatedPath = resolve(`/api/v1/geo/related/${params.code}`);

  try {
    const taxonomy = await (await fetch(taxonomyPath)).json();
    const metadata = await (await fetch(metadataPath)).json();
    const areas = [...(await (await fetch(areasPath)).json())].sort((a, b) =>
      a.areanm.localeCompare(b.areanm)
    );
    const related = await (await fetch(relatedPath)).json();
    const geoGroups = [{ id: "level", label: `All ${pluralise(geoLevel.label)}`, geoLevel: geoLevel.key }];
		if (geoLevel && related?.siblings?.parent) geoGroups.push({
			id: "siblings",
			label: `All ${pluralise(geoLevel.label)} ${formatName(related.siblings.parent.areanm, "in")}`,
			geoLevel: geoLevel.key,
			geoExtent: related.siblings.parent.areacd,
		});
		if (related.similar?.[2]?.cluster) geoGroups.push({
			id: "cluster",
			label: `Similar demographics to ${formatName(area.properties.areanm, "the")}`,
			geoCluster: `demographic_${related.similar[2].cluster.key}`,
		});

    return {
      taxonomy: taxonomy.data,
      metadata,
      areas,
      parent: areaParent,
      related,
      geoGroups,
      periods: summaryData.years,
    };
  } catch(err) {
		console.log(err);
    error(404, { message: "Could not retrieve metadata" });
  }
};
