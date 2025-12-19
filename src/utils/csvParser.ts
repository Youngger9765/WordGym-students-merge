/**
 * CSV/TSV Parser Utilities
 * Migrated from index.html lines 139-185, 756-818
 */

export interface ParsedRow {
  [key: string]: string;
}

/**
 * Parse TSV (Tab-Separated Values) text into array of objects
 * Smart header detection - looks for rows containing 'english_word', 'word', '英文', or '英文單字'
 */
export function parseTSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Find header row that contains english_word, word, or 英文
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const headers = line
      .split('\t')
      .map(h => String(h || '').replace(/^\uFEFF/, '').trim().toLowerCase());

    if (
      headers.includes('english_word') ||
      headers.includes('word') ||
      headers.includes('英文') ||
      headers.includes('英文單字')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  // Fallback to first line if no header found
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    console.warn('Warning: No header row found with english_word/word field. Using first line as header.');
  }

  const headers = lines[headerRowIndex]
    .split('\t')
    .map(h => String(h || '').replace(/^\uFEFF/, '').trim());
  const rows: ParsedRow[] = [];

  // Parse data rows starting from header + 1
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t');
    const row: ParsedRow = {};
    headers.forEach((header, idx) => {
      row[header] = String(values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse CSV text into array of objects
 * Smart header detection with proper quote handling
 * Migrated from index.html lines 756-818
 */
export function parseCSV(text: string): ParsedRow[] {
  const rows: string[][] = [];
  let i = 0;
  let cur = '';
  let inQ = false;
  let row: string[] = [];

  const pushCell = () => {
    row.push(cur);
    cur = '';
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  // Tokenize CSV into rows/cells
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQ = !inQ;
      i++;
      continue;
    }
    if (!inQ && ch === ',') {
      pushCell();
      i++;
      continue;
    }
    if (!inQ && ch === '\n') {
      pushCell();
      pushRow();
      i++;
      continue;
    }
    if (!inQ && ch === '\r' && text[i + 1] === '\n') {
      pushCell();
      pushRow();
      i += 2;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.length || row.length) {
    pushCell();
    pushRow();
  }
  if (!rows.length) return [];

  // Smart scan: find real header row
  let headerIndex = -1;
  let headers: string[] = [];

  for (let r = 0; r < Math.min(rows.length, 8000); r++) {
    const potentialHeaders = rows[r]
      .map(h => String(h || '').replace(/^\uFEFF/, '').trim().toLowerCase());

    if (
      potentialHeaders.includes('english_word') ||
      potentialHeaders.includes('word') ||
      potentialHeaders.includes('英文')
    ) {
      headerIndex = r;
      headers = rows[r].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
      break;
    }
  }

  // Fallback to first row
  if (headerIndex === -1) {
    headerIndex = 0;
    headers = rows[0].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
    console.warn('Warning: No header row found. Using first row as headers.');
  }

  // Convert to objects
  const result: ParsedRow[] = [];
  for (let r = headerIndex + 1; r < rows.length; r++) {
    const values = rows[r];
    const obj: ParsedRow = {};
    headers.forEach((header, idx) => {
      obj[header] = String(values[idx] || '').trim();
    });
    result.push(obj);
  }

  return result;
}

/**
 * Load data from Google Sheets as TSV
 */
export async function loadFromGoogleSheet(sheetConfig: {
  name: string;
  sheetId: string;
  gid: string;
  theme: string;
}): Promise<{ rows: ParsedRow[]; theme: string }> {
  try {
    const tsvUrl = `https://docs.google.com/spreadsheets/d/${sheetConfig.sheetId}/export?format=tsv&gid=${sheetConfig.gid}`;
    // Removed logging: ${sheetConfig.name}`, tsvUrl);

    const response = await fetch(tsvUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tsvText = await response.text();
    // Removed logging;

    const rows = parseTSV(tsvText);
    // Removed logging;

    return { rows, theme: sheetConfig.theme };
  } catch (error) {
    console.error(`Failed to load: ${sheetConfig.name}`, error);
    throw error;
  }
}

/**
 * Load all configured Google Sheets
 */
export async function loadAllGoogleSheets(config: {
  enabled: boolean;
  sheets: Array<{
    name: string;
    sheetId: string;
    gid: string;
    theme: string;
  }>;
}): Promise<Array<{ rows: ParsedRow[]; theme: string }>> {
  if (!config.enabled) return [];

  const results: Array<{ rows: ParsedRow[]; theme: string }> = [];
  for (const sheetConfig of config.sheets) {
    try {
      const result = await loadFromGoogleSheet(sheetConfig);
      results.push(result);
    } catch (error) {
      console.warn(`Skipping: ${sheetConfig.name}`);
    }
  }

  return results;
}
