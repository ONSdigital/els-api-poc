import type { PageLoad } from './$types';
import { resolve } from "$app/paths";
import { geoLevels } from "$lib/config/geoLevels";

export const load: PageLoad = async ({ params, fetch }) => {
  const path = resolve(
    `/api/v1/metadata/indicators/${params.code}?fullDims=true`
  );
  const indicator = await (await fetch(path)).json();

  const periodPath = resolve(
    `/api/v1/metadata/indicators/${params.code}/dimensions/period`
  );
  const periodsRaw = await (await fetch(periodPath)).json();
  const periods = Object.keys(periodsRaw.category.index);

  const areasPath = resolve(
    `/api/v1/geo/list?indicator=${params.code}&year=all`
  );
  const areas = (await (await fetch(areasPath)).json()).sort((a, b) =>
    a.areanm.localeCompare(b.areanm)
  );
  const gLevels = indicator.geography.levels.map((id) => ({
    id,
    ...geoLevels[id],
  }));
  // const periods = Object.keys(metadata.dimensions[1].category.index);

  return {
    indicator,
    areas,
    geoLevels: gLevels,
    periods,

    // Page metadata
    title: `${indicator.label} - ONS`,
    description: indicator.subtitle,
    pageType: `indicator data page`,
    breadcrumbLinks: [
      { label: "Home", href: resolve("/") },
      { label: "Explore local statistics", href: resolve("/") },
      { label: "Indicators", href: resolve("/indicators") },
    ],
    breadcrumbBackground: "#eaeaea",
  };
};
