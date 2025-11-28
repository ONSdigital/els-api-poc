// @ts-nocheck
import type { LayoutLoad } from "./$types";
import { resolve } from "$app/paths";

export const load: LayoutLoad = async ({ fetch }) => {
  const path = resolve("/api/v1/metadata/taxonomy?excludeMultivariate=true");
  const taxonomy = await (await fetch(path)).json();

  return {
    taxonomy,
  };
};
