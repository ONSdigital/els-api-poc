import { error, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    const areaPath = resolve(`/api/v1/geo/lookup/${params.code}`);
    const area = await (await fetch(areaPath)).json();
    return { area };
  } catch (err) {
    console.log(err);
		error(404, { message: "Invalid area code" });
  }
};
