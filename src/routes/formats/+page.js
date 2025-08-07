import { base } from "$app/paths";

export async function load({fetch}) {
  const url = `${base}/api.json?geography=E92000001&time=latest&measure=value`;
  const json = await (await fetch(url)).json();

  return json;
}