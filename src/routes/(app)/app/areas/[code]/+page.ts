import type { PageLoad } from "./$types";
import { resolve } from "$app/paths";
import { getName } from "@onsvisual/robo-utils";

export const load: PageLoad = async ({ parent }) => {
  const { area } = await parent();

  return {
    // Page metadata
    title: `${getName(area.properties)} (${area.properties.areacd}) - ONS`,
    description: `Find facts and figures from across the ONS on ${getName(area.properties, "the")} (${area.properties.typenm}).`,
    pageType: `area page`,
    breadcrumbLinks: [
      { label: "Home", href: resolve("/") },
      { label: "Explore local statistics", href: resolve("/app") },
      ...[...area.properties.parents]
        .reverse()
        .map((p) => ({
          label: getName(p),
          href: resolve(`/app/areas/${p.areacd}`),
        })),
    ],
    breadcrumbBackground: "#eaeaea",
  };
};
