import { areaMetadataBase } from "../config.js";
import { isValidAreaCode } from "../utils.js";

export default async function getAreaByCode(code) {
  code = code?.toUpperCase();
  if (!isValidAreaCode(code))
    return { error: 400, message: `${code} is not a valid GSS code.` };

  try {
    const url = `${areaMetadataBase}/${code.slice(0, 3)}/${code}.json`;
    const json = await (await fetch(url)).json();
    return json;
  } catch {
    return { error: 400, message: `Could not retreive metadata for ${code}.` };
  }
}
