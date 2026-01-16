// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  // Geo arrays/objects
  type areaObject = { areacd: string, areanm?: string, hclnm?: string, [key: string]: any };

  // Data arrays/objects
  type jsonDataRow = { [key: string]: any };
  type jsonDataRows = jsonDataRow[];
  type jsonDataColumns = { [key: string]: any[] };
  type jsonDataRowsKeyed = { [key: string]: jsonDataRows };

  // Data filter/format params
  type keyedDimensions = { [key: string]: string | string[] };

  // Miscellaneous
  type errorObject = { error: number, message: string };
}

export { };

