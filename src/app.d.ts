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

  // JSON-Stat (based on sub-set of full spec)
  type jsonStatDimension = { label?: string, category: { index: { [key: string]: number }, label?: { [key: string]: string } } };
  type jsonStatDataset = {
    version: "2.0",
    class: "dataset",
    label: string,
    id: string[],
    size: number[],
    role: { [key: string]: string[] },
    dimension: { [key: string]: jsonStatDimension },
    value: (number | null)[],
    source?: string,
    updated?: string,
    note?: string[],
    status?: { [key: string]: string },
    extension?: any
  };
  type jsonStatCollection = { version: "2.0", class: "collection", label: string, link: { item: jsonStatDataset[] } };

  // Data filter/format params
  type parsedParam = string | string[] | number | boolean | null;
  type parsedParams = { [key: string]: parsedParam };
  type dataFormat = "json" | "csv" | "csvw" | "xlsx" | "cols.json" | "rows.json";
  type keyedDimensions = { [key: string]: string | string[] };
  type dimensionFilters = { [key: string]: any };

  // Miscellaneous
  type errorObject = { error: number, message: string };
}

export { };

