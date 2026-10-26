import { RawMatrixRow, NormalizedPriceRecord, SheetColumnHeader } from '../types/pricing';
import { SHEET_COLUMNS, normalizeMatrix, RAW_SOURCE_MATRIX } from '../data/defaultPriceData';

const STORAGE_KEY_MATRIX = 'smart_price_matrix_data_v1';
const STORAGE_KEY_META = 'smart_price_metadata_v1';

export interface StorageMeta {
  sourceType: 'default_sheet' | 'google_sheet_url' | 'imported_file';
  sourceName: string;
  lastSyncTimestamp: string;
  googleSheetUrl?: string;
}

/**
 * Converts a standard Google Sheets URL into a direct CSV export URL
 */
export function convertGoogleSheetsUrlToCsv(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  // If already a direct CSV or pub output=csv URL
  if (trimmed.includes('output=csv') || trimmed.includes('export?format=csv')) {
    return trimmed;
  }

  // Published to web format: https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
  const pubMatch = trimmed.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && trimmed.includes('/pub')) {
    return `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv`;
  }

  // Standard edit URL format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
  const sheetIdMatch = trimmed.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetIdMatch) {
    const sheetId = sheetIdMatch[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

/**
 * Parses CSV/TSV text into RawMatrixRow[] with validation
 */
export function parseSheetCsv(csvContent: string): { matrix: RawMatrixRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { matrix: [], errors: ['Provided CSV is empty.'] };
  }

  // Simple CSV line parser handling quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    // Check if line is tab-separated
    if (line.includes('\t') && !line.includes(',')) {
      return line.split('\t').map((s) => s.trim().replace(/^"|"$/g, ''));
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Find header line or assume columns
  // If the sheet has 2 header rows (like "LMV FEE", then "REGULAR, FLEXI, LUMPSUM")
  let dataStartIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cells = parseLine(lines[i]).map((c) => c.toUpperCase());
    if (cells.some((c) => c.includes('REGULAR') || c.includes('FLEXI') || c.includes('THEORY'))) {
      dataStartIndex = i + 1;
      break;
    }
  }

  const matrix: RawMatrixRow[] = [];
  const seenServices = new Set<string>();

  for (let idx = dataStartIndex; idx < lines.length; idx++) {
    const cells = parseLine(lines[idx]);
    if (cells.length === 0) continue;

    const rawService = cells[0]?.trim();
    if (!rawService || rawService.length < 2) continue;

    // Filter out duplicate or header repetition
    const upper = rawService.toUpperCase();
    if (upper === 'SERVICE' || upper === 'FEE' || upper.startsWith('CATEGORY') || upper.includes('REGULAR')) {
      continue;
    }

    if (seenServices.has(rawService)) {
      continue; // Avoid duplicate services during import
    }
    seenServices.add(rawService);

    const prices: Record<string, number | null> = {};

    SHEET_COLUMNS.forEach((col, colIdx) => {
      const rawVal = cells[colIdx + 1]?.trim();
      if (!rawVal || rawVal === '' || rawVal === '-' || rawVal.toLowerCase() === 'n/a' || rawVal.toLowerCase() === 'null') {
        prices[col.key] = null;
      } else {
        const cleaned = rawVal.replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num)) {
          prices[col.key] = num;
        } else {
          prices[col.key] = null;
          errors.push(`Row "${rawService}", column ${col.headerLabel}: could not parse "${rawVal}" as number`);
        }
      }
    });

    matrix.push({
      serviceName: rawService,
      prices,
    });
  }

  if (matrix.length === 0) {
    errors.push('No valid service rows found in CSV format.');
  }

  return { matrix, errors };
}

/**
 * Fetches Google Sheet via public CSV URL
 */
export async function fetchGoogleSheetCsv(url: string): Promise<{ matrix: RawMatrixRow[]; errors: string[] }> {
  const exportUrl = convertGoogleSheetsUrlToCsv(url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(exportUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Google Sheet request failed with HTTP ${res.status}: ${res.statusText}`);
    }

    const csvText = await res.text();
    if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
      throw new Error(
        'The URL returned HTML instead of CSV. Ensure your Google Sheet is shared as "Anyone with the link can view", or published via File > Share > Publish to web > CSV format.'
      );
    }

    return parseSheetCsv(csvText);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      matrix: [],
      errors: [message],
    };
  }
}

/**
 * Generates downloadable CSV content from current matrix
 */
export function exportMatrixToCsv(matrix: RawMatrixRow[]): string {
  // Line 1: Group headers
  const line1 = ['SERVICE NAME', 'LMV FEE', '', '', 'MOT FEE', '', '', 'HVB FEE', '', 'HVT FEE', '', 'HME FEE', ''];
  // Line 2: Specific column headers
  const line2 = [
    'Service',
    ...SHEET_COLUMNS.map((col) => `${col.category} - ${col.feeType}`),
  ];

  const dataRows = matrix.map((row) => {
    const cols = SHEET_COLUMNS.map((col) => {
      const val = row.prices[col.key];
      return val !== null && val !== undefined ? String(val) : '';
    });
    return [`"${row.serviceName.replace(/"/g, '""')}"`, ...cols].join(',');
  });

  return [line1.join(','), line2.join(','), ...dataRows].join('\r\n');
}

/**
 * Loads data from localStorage or falls back to default verified matrix
 */
export function loadSavedMatrix(): { matrix: RawMatrixRow[]; meta: StorageMeta } {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY_MATRIX);
    const savedMeta = localStorage.getItem(STORAGE_KEY_META);

    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const meta: StorageMeta = savedMeta
          ? JSON.parse(savedMeta)
          : {
              sourceType: 'imported_file',
              sourceName: 'Saved Driving School Sheet',
              lastSyncTimestamp: new Date().toLocaleTimeString(),
            };
        return { matrix: parsed, meta };
      }
    }
  } catch (e) {
    console.warn('Failed to load pricing matrix from localStorage, fallback to default', e);
  }

  return {
    matrix: RAW_SOURCE_MATRIX,
    meta: {
      sourceType: 'default_sheet',
      sourceName: 'Official RTA Driving School Price List (Verified Source)',
      lastSyncTimestamp: 'Synchronized with Source Sheet',
    },
  };
}

/**
 * Saves current matrix to localStorage
 */
export function saveMatrixToStorage(matrix: RawMatrixRow[], meta: StorageMeta) {
  try {
    localStorage.setItem(STORAGE_KEY_MATRIX, JSON.stringify(matrix));
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to save pricing matrix to localStorage', e);
  }
}

/**
 * Clears saved data and restores the official verified matrix
 */
export function resetToDefaultMatrix(): { matrix: RawMatrixRow[]; meta: StorageMeta } {
  try {
    localStorage.removeItem(STORAGE_KEY_MATRIX);
    localStorage.removeItem(STORAGE_KEY_META);
  } catch (e) {
    console.error('Error clearing localStorage', e);
  }

  return {
    matrix: RAW_SOURCE_MATRIX,
    meta: {
      sourceType: 'default_sheet',
      sourceName: 'Official RTA Driving School Price List (Verified Source)',
      lastSyncTimestamp: 'Synchronized with Source Sheet',
    },
  };
}

/**
 * Formats a price into standard AED currency representation
 * Preserves decimals (e.g. 103.95 -> AED 103.95, 293.5 -> AED 293.50, 415 -> AED 415.00)
 */
export function formatAED(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return '—';
  }
  return `AED ${price.toFixed(2)}`;
}
