import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";

export const load = () => {
  redirect(308, resolve("/areas/K02000001"));
};