import { json, error } from "@sveltejs/kit";
import getAreaByCode from "$lib/api/geo/getAreaByCode";

export async function GET({ params }) {
  const code = params.code;

  const area = await getAreaByCode(code);
  if (area.error) error(area.error, area.message);

  return json(area);
}
