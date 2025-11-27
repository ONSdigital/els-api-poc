import { error } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { pluralise, getName } from "@onsvisual/robo-utils";
import summaryData from "$lib/data/json-stat-summary.json";
import { geoLevels, geoLevelsLookup } from "$lib/config/geo-levels";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, fetch }) => {
  const { area } = await parent();
  const code = area.properties.areacd;

  const geoLevel = geoLevelsLookup[code.slice(0, 3)];
  const parentLevel =
    geoLevels[["ctry", "rgn"].includes(geoLevel?.key) ? "ctry" : "rgn"];
  const areaParent = area.properties.parents.find((p) =>
    parentLevel.codes.includes(p.areacd.slice(0, 3))
  );

  const taxonomyPath = resolve(
    `/api/v1/metadata/taxonomy?hasGeo=${code}&excludeMultivariate=true`
  );
  const metadataPath = resolve(
    `/api/v1/metadata/indicators?hasGeo=${code}&excludeMultivariate=true&asLookup=true`
  );
  const areasPath = resolve(`/api/v1/geo/list?year=latest`);
  const relatedPath = resolve(`/api/v1/geo/related/${code}`);

  try {
    const taxonomy = await (await fetch(taxonomyPath)).json();
    const metadata = await (await fetch(metadataPath)).json();
    const areas = [...(await (await fetch(areasPath)).json())].sort((a, b) =>
      a.areanm.localeCompare(b.areanm)
    );
    const related = await (await fetch(relatedPath)).json();
    const geoGroups = [
      {
        id: "level",
        label: `All ${pluralise(geoLevel.label)}`,
        geoLevel: geoLevel.key,
      },
    ];
    if (geoLevel && related?.siblings?.parent)
      geoGroups.push({
        id: "siblings",
        label: `All ${pluralise(geoLevel.label)} ${getName(related.siblings.parent, "in")}`,
        geoLevel: geoLevel.key,
        geoExtent: related.siblings.parent.areacd,
      });
    if (related.similar?.[2]?.cluster)
      geoGroups.push({
        id: "cluster",
        label: `Similar demographics to ${getName(area.properties, "the")}`,
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

      // Page metadata
      title: `${getName(area.properties)} (${area.properties.areacd}) - ONS`,
      description: `Find facts and figures from across the ONS on ${getName(area.properties, "the")} (${area.properties.typenm}).`,
      pageType: `area page`,
      breadcrumbLinks: [
        { label: "Home", href: resolve("/") },
        { label: "Explore local statistics", href: resolve("/app") },
        ...[...area.properties.parents].reverse().map((p) => ({
          label: getName(p),
          href: resolve(`/app/areas/${p.areacd}`),
        })),
      ],
    };
  } catch (err) {
    console.log(err);
    error(404, { message: "Could not retrieve metadata" });
  }
};
