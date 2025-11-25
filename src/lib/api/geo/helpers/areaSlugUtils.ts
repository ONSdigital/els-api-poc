import { isValidAreaCode } from "$lib/api/utils";
import { slugify } from "$lib/utils";

type AreaCodeResult = string | { error: number, message: string };

export function extractAreaCodeFromSlug(slug: string): AreaCodeResult {
  const parts = slug.split("-");
  const code = parts[0];

  if (isValidAreaCode(code)) return code;
  return { error: 400, message: "Invalid GSS code" };
}

export const makeCanonicalSlug = (code: string, name?: string) => {
  if (!code) throw "No area code was given";
  if (!name) return code;

  return `${code}-${slugify(name)}`;
};
