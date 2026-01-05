import { areaMetadataBase } from "../config";
import { isValidAreaCode } from "../utils";
import groupAreasByLevel from "./helpers/groupAreasByLevel";

export default async function getAreaByCode(code) {
  code = code?.toUpperCase();
  if (!isValidAreaCode(code))
    return { error: 400, message: `${code} is not a valid GSS code.` };

  try {
    const url = `${areaMetadataBase}/${code.slice(0, 3)}/${code}.json`;
    const json = await (await fetch(url)).json();
    json.properties.children = groupAreasByLevel(json.properties.children, "nav");
    return json;
  } catch {
    return { error: 400, message: `Could not retreive metadata for ${code}.` };
  }
}
