import { json, error } from "@sveltejs/kit";
import getDimensions from "$lib/api/metadata/getDimensions";

export function GET({ params }) {
  const indicator = params.indicator || null;
  const dimension = params.dimension || null;

  const dimensions = getDimensions({indicator, dimension});
  if (dimensions.error) error(dimensions.error, dimensions.message);

  return json(dimensions);
}