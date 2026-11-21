import * as XLSX from 'xlsx';
import {
  DEFAULT_INSTRUCTORS_COLUMNS,
  DEFAULT_INSTRUCTORS_FILE_NAME,
  DEFAULT_INSTRUCTORS_RECORDS,
} from '../data/instructorsData';
import {
  DetectedInstructorColumns,
  ExcelImportPreview,
  InstructorRecord,
  InstructorsDataset,
} from '../types/instructors';

/**
 * Automatically detects standard instructor column roles based on actual Excel headers.
 * Never invents columns that do not exist in the file.
 */
export function detectInstructorColumns(columns: string[]): DetectedInstructorColumns {
  const findCol = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const match = columns.find((col) => pattern.test(col.trim()));
      if (match) return match;
    }
    return null;
  };

  const idCol = findCol([
    /^(id|instructor\s*id|emp(loyee)?\s*id|staff\s*id|code)$/i,
    /\b(instructor\s*id|emp\s*id|staff\s*id)\b/i,
  ]);

  const nameCol = findCol([
    /^(name|instructor\s*name|full\s*name|instructor)$/i,
    /\b(instructor\s*name|full\s*name)\b/i,
  ]);

  const branchCol = findCol([
    /^(branch|branch\s*name|center|centre|location|office)$/i,
    /\b(branch|center|centre)\b/i,
  ]);

  const phoneCol = findCol([
    /^(mobile(\s*number|\s*no\.?)?|phone(\s*number|\s*no\.?)?|contact(\s*number|\s*no\.?)?|tel(ephone)?)$/i,
    /\b(mobile|phone|contact)\b/i,
  ]);

  const nationalityCol = findCol([
    /^(nationality|country|citizenship)$/i,
    /\bnationality\b/i,
  ]);

  const statusCol = findCol([
    /^(status|active\s*status|employment\s*status|state)$/i,
    /\bstatus\b/i,
  ]);

  const categoryCol = findCol([
    /^(category|license(\s*category|\s*type)?|licence(\s*category|\s*type)?|teaching\s*category|vehicle\s*category|class)$/i,
    /\b(category|license|licence)\b/i,
  ]);

  const languageCol = findCol([
    /^(language|languages|spoken\s*language(s)?)$/i,
    /\blanguage\b/i,
  ]);

  return {
    idCol,
    nameCol,
    branchCol,
    phoneCol,
    nationalityCol,
    statusCol,
    categoryCol,
    languageCol,
  };
}

/**
 * Returns the initial dataset extracted verbatim from the uploaded file.
 */
export function getDefaultInstructorsDataset(): InstructorsDataset {
  return {
    fileName: DEFAULT_INSTRUCTORS_FILE_NAME,
    sheetNames: ['Sheet1'],
    columns: [...DEFAULT_INSTRUCTORS_COLUMNS],
    detectedColumns: detectInstructorColumns(DEFAULT_INSTRUCTORS_COLUMNS),
    records: DEFAULT_INSTRUCTORS_RECORDS,
    isDefaultSource: true,
    importedAt: 'Initial Source File',
  };
}

/**
 * Extracts exact string value from a SheetJS cell without scientific notation corruption on phone numbers/IDs.
 */
function extractCellString(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';

  if (cell.t === 'n' && typeof cell.v === 'number') {
    // Prevent scientific notation on long phone numbers or IDs (e.g. 971563073640 -> "971563073640")
    if (Number.isInteger(cell.v) && (!cell.w || /[eE][+-]?\d+/.test(cell.w))) {
      return cell.v.toFixed(0);
    }
    if (cell.w !== undefined && !/[eE][+-]?\d+/.test(cell.w)) {
      return String(cell.w).trim();
    }
    return String(cell.v).trim();
  }

  if (cell.w !== undefined) {
    return String(cell.w).trim();
  }

  return String(cell.v).trim();
}

/**
 * Reads an uploaded .xlsx, .xls, or .csv file across ALL worksheets,
 * automatically identifies headers, deduplicates records, and returns a preview.
 */
export async function parseInstructorsWorkbook(file: File): Promise<ExcelImportPreview> {
  const lowerName = file.name.toLowerCase();
  const isCsv = lowerName.endsWith('.csv');
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    if (isCsv) {
      const bytes = new Uint8Array(buffer);
      let text = new TextDecoder('utf-8').decode(bytes);
      if (text.includes('\uFFFD')) {
        text = new TextDecoder('windows-1252').decode(bytes);
      }
      workbook = XLSX.read(text, { type: 'string', raw: false });
    } else {
      workbook = XLSX.read(buffer, { type: 'array', raw: false });
    }
  } catch (err) {
    throw new Error(
      `Unable to read "${file.name}". Please ensure it is a valid .xlsx, .xls, or .csv file.`
    );
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded workbook contains no worksheets.');
  }

  const allColumnsSet = new Set<string>();
  const orderedColumns: string[] = [];
  const rawExtractedRows: { sheetName: string; fields: Record<string, string> }[] = [];
  const warnings: string[] = [];
  let emptyRowsSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) {
      warnings.push(`Worksheet "${sheetName}" is empty and was skipped.`);
      continue;
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);

    // Scan rows to find the header row (first row with at least 1 non-empty cell)
    let headerRowIdx = -1;
    const sheetHeaders: { colIdx: number; name: string }[] = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
      const rowCells: { colIdx: number; text: string }[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const val = extractCellString(sheet[addr]);
        if (val !== '') {
          rowCells.push({ colIdx: c, text: val });
        }
      }
      if (rowCells.length > 0) {
        headerRowIdx = r;
        const usedHeaderNames = new Set<string>();
        rowCells.forEach(({ colIdx, text }) => {
          let finalHeader = text;
          let suffix = 2;
          while (usedHeaderNames.has(finalHeader)) {
            finalHeader = `${text} (${suffix++})`;
          }
          usedHeaderNames.add(finalHeader);
          sheetHeaders.push({ colIdx, name: finalHeader });
        });
        break;
      }
    }

    if (headerRowIdx === -1 || sheetHeaders.length === 0) {
      warnings.push(`Worksheet "${sheetName}" has no recognizable header row and was skipped.`);
      continue;
    }

    // Check if any data columns exist outside the named headers
    const namedColIndices = new Set(sheetHeaders.map((h) => h.colIdx));
    let hasUnnamedDataCols = false;
    for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        if (!namedColIndices.has(c)) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (extractCellString(sheet[addr]) !== '') {
            hasUnnamedDataCols = true;
            const colLetter = XLSX.utils.encode_col(c);
            const fallbackName = `Column ${colLetter}`;
            sheetHeaders.push({ colIdx: c, name: fallbackName });
            namedColIndices.add(c);
          }
        }
      }
    }
    if (hasUnnamedDataCols) {
      warnings.push(
        `Worksheet "${sheetName}" contained values in columns without headers; labeled automatically by column letter.`
      );
    }

    for (const h of sheetHeaders) {
      if (!allColumnsSet.has(h.name)) {
        allColumnsSet.add(h.name);
        orderedColumns.push(h.name);
      }
    }

    // Extract rows below headerRowIdx
    for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
      const fields: Record<string, string> = {};
      let rowHasValue = false;

      for (const h of sheetHeaders) {
        const addr = XLSX.utils.encode_cell({ r, c: h.colIdx });
        const val = extractCellString(sheet[addr]);
        if (val !== '') {
          rowHasValue = true;
        }
        fields[h.name] = val;
      }

      if (!rowHasValue) {
        emptyRowsSkipped++;
        continue;
      }

      rawExtractedRows.push({ sheetName, fields });
    }
  }

  if (orderedColumns.length === 0 || rawExtractedRows.length === 0) {
    throw new Error(
      'No instructor records could be extracted. Please check that your Excel/CSV file contains column headers and at least one row of data.'
    );
  }

  const detectedColumns = detectInstructorColumns(orderedColumns);

  // Ensure every record has keys for all columns across sheets & deduplicate records
  const seenKeys = new Set<string>();
  const dedupedRecords: InstructorRecord[] = [];
  let duplicatesRemoved = 0;

  rawExtractedRows.forEach((raw, idx) => {
    const normalizedFields: Record<string, string> = {};
    for (const col of orderedColumns) {
      normalizedFields[col] = raw.fields[col] ?? '';
    }

    // Build deduplication key: prefer ID column if present and non-empty, else full row signature
    let dedupeKey = '';
    if (detectedColumns.idCol && normalizedFields[detectedColumns.idCol]?.trim()) {
      dedupeKey = `ID:${normalizedFields[detectedColumns.idCol].trim().toLowerCase()}`;
    } else {
      dedupeKey =
        'ROW:' +
        orderedColumns
          .map((col) => (normalizedFields[col] || '').trim().toLowerCase())
          .join('|');
    }

    if (seenKeys.has(dedupeKey)) {
      duplicatesRemoved++;
      return;
    }
    seenKeys.add(dedupeKey);

    dedupedRecords.push({
      _rowKey: `imp-${idx + 1}`,
      _sheetName: raw.sheetName,
      fields: normalizedFields,
    });
  });

  if (duplicatesRemoved > 0) {
    warnings.push(
      `${duplicatesRemoved} duplicate instructor record${duplicatesRemoved > 1 ? 's were' : ' was'} automatically skipped.`
    );
  }

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    columns: orderedColumns,
    detectedColumns,
    records: dedupedRecords,
    totalRawRows: rawExtractedRows.length,
    duplicatesRemoved,
    emptyRowsSkipped,
    warnings,
  };
}

/**
 * Exports filtered instructor rows to a downloadable Excel (.xlsx) file.
 */
export function exportInstructorsToExcel(
  records: InstructorRecord[],
  columns: string[],
  fileNamePrefix = 'EcoDrive_Instructors'
): void {
  const rows = records.map((rec) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      obj[col] = rec.fields[col] || '';
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Instructors');

  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileNamePrefix}_${dateTag}.xlsx`);
}

/**
 * Exports filtered instructor rows to a downloadable CSV (.csv) file.
 */
export function exportInstructorsToCSV(
  records: InstructorRecord[],
  columns: string[],
  fileNamePrefix = 'EcoDrive_Instructors'
): void {
  const escapeCsv = (val: string): string => {
    if (/[",\n\r]/.test(val)) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines = [
    columns.map(escapeCsv).join(','),
    ...records.map((rec) =>
      columns.map((col) => escapeCsv(rec.fields[col] || '')).join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `${fileNamePrefix}_${dateTag}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
