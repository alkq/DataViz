import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ColumnType = 'number' | 'date' | 'text';

export interface ParsedColumn {
  name: string;
  type: ColumnType;
}

export interface ParsedDataset {
  columns: ParsedColumn[];
  rows: Record<string, unknown>[];
}

const MAX_ROWS = 50000;

function detectType(values: unknown[]): ColumnType {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (sample.length === 0) return 'text';

  let allNumbers = true;
  let allDates = true;
  for (const v of sample) {
    const s = String(v).trim();
    if (s === '') continue;
    if (isNaN(Number(s))) allNumbers = false;
    // Accept ISO-ish dates; avoid treating pure numbers as dates.
    if (isNaN(Date.parse(s)) || /^\d+$/.test(s)) allDates = false;
  }

  if (allNumbers) return 'number';
  if (allDates && !allNumbers) return 'date';
  return 'text';
}

/**
 * Parse raw file bytes into a normalized dataset.
 * Supports .csv (and .tsv) via PapaParse and .xlsx/.xls via SheetJS.
 */
export function parseFileBuffer(buffer: Buffer, filename: string): ParsedDataset {
  const lower = filename.toLowerCase();
  let records: Record<string, unknown>[] = [];

  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    const text = buffer.toString('utf8');
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
    });
    records = (result.data || []).filter(
      (r) => r && Object.keys(r).length > 0,
    );
  } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = wb.SheetNames[0];
    if (!firstSheet) throw new Error('Excel file has no sheets');
    const sheet = wb.Sheets[firstSheet];
    records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });
  } else {
    throw new Error('Unsupported file type. Upload a .csv or .xlsx/.xls file.');
  }

  if (records.length === 0) {
    throw new Error('No rows found in file');
  }

  // Truncate to protect the DB from abusive uploads.
  if (records.length > MAX_ROWS) {
    records = records.slice(0, MAX_ROWS);
  }

  const headers = Object.keys(records[0]).filter((h) => h && h.length > 0);
  const columns: ParsedColumn[] = headers.map((name) => ({
    name,
    type: detectType(records.map((r) => r[name])),
  }));

  // Normalize: ensure every row has all columns; trim strings.
  const rows = records.map((r) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      let val = r[col.name];
      if (typeof val === 'string') val = val.trim();
      out[col.name] = val ?? null;
    }
    return out;
  });

  return { columns, rows };
}
