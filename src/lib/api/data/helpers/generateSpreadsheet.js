import JSZip from "jszip";
import accessibleSpreadsheetCreator from "accessible-spreadsheet-creator";

// This function grabs the metadata from the JSON-Stat required to populate the ODS spreadsheet
export function getSpreadsheetMetadata(ds) {
  const meta = {
    sheetName: ds.label,
    tableName: ds.extension.slug.replaceAll("-", "_"),
    note: ds.extension.description,
    measures: new Set(),
    decimalPlaces: ds.extension.decimalPlaces,
    subtitle: ds.extension.subtitle,
    source: ds.extension.source,
    colLookup: {},
  };
  for (const key in ds.dimension) meta.colLookup[key] = ds.dimension[key].label;
  for (const key in ds.dimension.measure.category.label) {
    meta.colLookup[key] =
      key === "value"
        ? `Value (${ds.extension.unit})`
        : ds.dimension.measure.category.label[key];
    meta.measures.add(key);
  }
  return meta;
}

// This function generates an ODS spreadsheet given data and metadata for a series of datasets
export default async function generateSpreadsheet(datasets) {
  // Note: This cover sheet is currently hard-coded. Possibly better to move somewhere else?
  const odsData = {
    coverSheetTitle: "Explore Local Statistics data",
    coverSheetContents: [
      "## Source",
      "Office for National Statistics (ONS) and other producers of official statistics.",
      "[Visit Explore Local Statistics on the ONS website](https://www.ons.gov.uk)",
      "## Notes",
      "Some cells are blank, indicating unavailable data.",
      "This dataset includes time periods in an extended ISO 8601 format. These periods are written as 'YYYY-MM-DD/PnI', where 'P' means it's a period, 'n' is the number of time units and 'I' is the type of time unit (Y = year, M = month, W = week, D = day).",
      "## Quality and methodology",
      "Details of the Explore Local Statistics service are available at the link below, including its strengths and limitations, methods used, data uses and users.",
      "[Quality and methodology information](https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi)",
    ],
    notes: [],
    sheets: [],
  };

  let i = 0;
  for (const ds of datasets) {
    if (ds.meta.note) {
      i++;
      odsData.notes.push({
        name: `note_${i}`,
        text: ds.meta.note,
      });
    }
    odsData.sheets.push({
      sheetName: ds.meta.note
        ? `${ds.meta.sheetName} [[note_${i}]]`
        : ds.meta.sheetName,
      tableName: ds.meta.tableName,
      sheetIntroText: [
        ds.meta.subtitle,
        ...ds.meta.source
          .map((s, j) => [
            `Source${ds.meta.source.length > 1 ? ` ${j + 1}` : ""}: ${s.name}, ${s.date.split("-").reverse().join("/")}`,
            s.href,
          ])
          .flat(),
      ],
      columns: Object.keys(ds.data[1]).map((key) => ({
        style: ds.meta.measures.has(key)
          ? ds.meta.decimalPlaces
            ? `number_${ds.meta.decimalPlaces}dp`
            : "number_with_commas"
          : "text",
        allowNulls: ds.meta.measures.has(key),
        heading: ds.meta.colLookup[key],
        values: ds.data[1][key],
      })),
    });
  }

  const zipFiles = accessibleSpreadsheetCreator(odsData);

  const zip = new JSZip();
  for (const { filename, contents } of zipFiles) {
    zip.file(filename, contents, {
      compression: filename === "mimetype" ? "STORE" : "DEFLATE",
    });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
}
