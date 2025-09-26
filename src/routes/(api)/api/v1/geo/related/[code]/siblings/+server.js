import { json, error } from "@sveltejs/kit";
import getSimilarAreas from "$lib/api/geo/getSimilarAreas.js";
import { isValidAreaCode } from "../../../../../../../lib/api/utils";

export function GET({ params }) {
  const code = params.code;
  if (!isValidAreaCode(code)) error(400, `${code} is not a valid GSS code`);

  const similarAreas = getSimilarAreas(code);
  if (!similarAreas) return error(400, `No similar areas for ${code}`);

  return json(similarAreas);
}
