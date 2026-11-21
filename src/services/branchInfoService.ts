import * as XLSX from 'xlsx';
import {
  DEFAULT_BRANCH_INFO_COLUMNS,
  DEFAULT_BRANCH_INFO_FILE_NAME,
  DEFAULT_BRANCH_INFO_NOTES,
  DEFAULT_BRANCH_INFO_RECORDS,
} from '../data/branchInfoData';
import {
  BranchInfoDataset,
  BranchInfoImportPreview,
  BranchInfoRecord,
  DetectedBranchInfoColumns,
  DynamicBranchFilterConfig,
} from '../types/branchInfo';

/**
 * Automatically detects semantic column roles from the actual Excel headers.
 * Returns null for any role not present in the active source file.
 */
export function detectBranchInfoColumns(columns: string[]): DetectedBranchInfoColumns {
  const findCol = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const match = columns.find((c) => pattern.test(c.trim()));
      if (match) return match;
    }
    return null;
  };

  return {
    snCol: findCol([/^(s\.?\s*no\.?|sn\.?|sr\.?\s*no\.?|#)$/i]),
    branchNameCol: findCol([
      /^(registration\s*offices?|branch\s*name|branch|office\s*name|center\s*name|centre\s*name)$/i,
      /\b(registration\s*office|branch\s*name)\b/i,
    ]),
    phoneCol: findCol([
      /^(contact\s*number|contact\s*#|phone(\s*number|\s*no\.?)?|mobile(\s*number|\s*no\.?)?|branch\s*#|tel(ephone)?)$/i,
      /\b(contact|phone|mobile)\b/i,
    ]),
    locationCol: findCol([
      /^(location|area|emirate|district|city)$/i,
      /\b(location|area)\b/i,
    ]),
    addressCol: findCol([
      /^(full\s*address|address|street\s*address)$/i,
      /\baddress\b/i,
    ]),
    mapLinkCol: findCol([
      /^(google\s*maps?|map\s*link|maps?\s*url|coordinates|lat\/long|gps)$/i,
      /\b(google\s*map|map\s*link|coordinates)\b/i,
    ]),
    branchCodeCol: findCol([/^(branch\s*code|code|office\s*code)$/i]),
    branchTypeCol: findCol([/^(branch\s*type|type|office\s*type|category)$/i]),
    managerCol: findCol([
      /^(manager(\s*name)?|person\s*in\s*charge|incharge|supervisor|branch\s*manager)$/i,
      /\b(manager|incharge)\b/i,
    ]),
    departmentCol: findCol([/^(department|departments|dept)$/i]),
    statusCol: findCol([/^(status|branch\s*status|active\s*status|state)$/i]),
    emailCol: findCol([/^(email|email\s*address|e-mail)$/i]),
    workingHoursCol: findCol([
      /^(working\s*hours|hours|timings|opening\s*hours|operating\s*hours)$/i,
    ]),
  };
}

/**
 * Dynamically builds filter configurations strictly from the actual columns and values
 * in the active Excel/CSV dataset. Never creates filters for non-existent fields.
 */
export function buildBranchFilterConfigs(
  columns: string[],
  records: BranchInfoRecord[],
  detected: DetectedBranchInfoColumns
): DynamicBranchFilterConfig[] {
  return columns
    .map((col) => {
      const valueCounts = new Map<string, number>();
      records.forEach((r) => {
        const val = (r.fields[col] || '').trim();
        if (val) {
          valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
        }
      });

      const options = Array.from(valueCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base', numeric: true }))
        .map(([value, count]) => ({ value, count }));

      const isBranchName = detected.branchNameCol === col;
      const isKnownSelectCol =
        col === detected.statusCol ||
        col === detected.branchTypeCol ||
        col === detected.departmentCol;
      const isIdentifierOrContactOrAddress =
        col === detected.snCol ||
        col === detected.phoneCol ||
        col === detected.locationCol ||
        col === detected.addressCol ||
        col === detected.emailCol ||
        col === detected.branchCodeCol ||
        col === detected.mapLinkCol;

      // Use dropdown for Branch Name, Status/Type/Department, or genuinely repeated categorical columns
      const isRepeatedCategorical =
        !isIdentifierOrContactOrAddress &&
        options.length >= 2 &&
        options.length <= 25 &&
        options.length < records.length * 0.65;

      const kind: 'select' | 'text' =
        isBranchName || isKnownSelectCol || isRepeatedCategorical ? 'select' : 'text';

      return {
        column: col,
        label: col,
        kind,
        options,
      };
    })
    .filter((cfg) => cfg.options.length > 0 || cfg.kind === 'text');
}

export function getDefaultBranchInfoDataset(): BranchInfoDataset {
  const detectedColumns = detectBranchInfoColumns(DEFAULT_BRANCH_INFO_COLUMNS);
  const filterConfigs = buildBranchFilterConfigs(
    DEFAULT_BRANCH_INFO_COLUMNS,
    DEFAULT_BRANCH_INFO_RECORDS,
    detectedColumns
  );

  return {
    fileName: DEFAULT_BRANCH_INFO_FILE_NAME,
    sheetNames: ['Sheet1'],
    columns: [...DEFAULT_BRANCH_INFO_COLUMNS],
    detectedColumns,
    filterConfigs,
    records: DEFAULT_BRANCH_INFO_RECORDS,
    notes: [...DEFAULT_BRANCH_INFO_NOTES],
    isDefaultSource: true,
    importedAt: 'Initial Source File',
  };
}

/**
 * Checks whether a value is a valid Google Maps URL or lat,lng coordinates.
 */
export function buildGoogleMapsHref(raw: string | undefined): string | null {
  const val = (raw ?? '').trim();
  if (!val) return null;

  if (
    /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps|maps\.google\.com)/i.test(
      val
    )
  ) {
    return val;
  }

  const coordMatch = val.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (coordMatch) {
    return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`;
  }

  return null;
}

function extractCellString(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';

  if (cell.t === 'n' && typeof cell.v === 'number') {
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
 * Reads ALL worksheets from an uploaded .xlsx, .xls, or .csv file,
 * locates true multi-column table headers (skipping title banner rows like "Branch List"),
 * extracts branch records and operational notes, and compares against existing records.
 */
export async function parseBranchInfoWorkbook(
  file: File,
  existingRecords: BranchInfoRecord[] = []
): Promise<BranchInfoImportPreview> {
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
  } catch {
    throw new Error(
      `Unable to read "${file.name}". Please ensure it is a valid .xlsx, .xls, or .csv file.`
    );
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded workbook contains no worksheets.');
  }

  const allColumnsSet = new Set<string>();
  const orderedColumns: string[] = [];
  const rawRecords: BranchInfoRecord[] = [];
  const extractedNotes: string[] = [];
  const warnings: string[] = [];
  let emptyRowsSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) {
      warnings.push(`Worksheet "${sheetName}" is empty and was skipped.`);
      continue;
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);

    // Locate header row: prefer the first row with >= 2 non-empty cells (skipping single-cell banner titles)
    let headerRowIdx = -1;
    let sheetHeaders: { colIdx: number; name: string }[] = [];
    let firstSingleCellFallback: { rowIdx: number; cells: { colIdx: number; text: string }[] } | null = null;

    for (let r = range.s.r; r <= range.e.r; r++) {
      const rowCells: { colIdx: number; text: string }[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const val = extractCellString(sheet[addr]);
        if (val !== '') {
          rowCells.push({ colIdx: c, text: val });
        }
      }

      if (rowCells.length >= 2) {
        headerRowIdx = r;
        const usedNames = new Set<string>();
        sheetHeaders = rowCells.map(({ colIdx, text }) => {
          let name = text;
          let suffix = 2;
          while (usedNames.has(name)) {
            name = `${text} (${suffix++})`;
          }
          usedNames.add(name);
          return { colIdx, name };
        });
        break;
      } else if (rowCells.length === 1 && !firstSingleCellFallback) {
        firstSingleCellFallback = { rowIdx: r, cells: rowCells };
      }
    }

    if (headerRowIdx === -1 && firstSingleCellFallback) {
      headerRowIdx = firstSingleCellFallback.rowIdx;
      sheetHeaders = firstSingleCellFallback.cells.map((c) => ({
        colIdx: c.colIdx,
        name: c.text,
      }));
    }

    if (headerRowIdx === -1 || sheetHeaders.length === 0) {
      warnings.push(`Worksheet "${sheetName}" has no recognizable header row and was skipped.`);
      continue;
    }

    for (const h of sheetHeaders) {
      if (!allColumnsSet.has(h.name)) {
        allColumnsSet.add(h.name);
        orderedColumns.push(h.name);
      }
    }

    const localDetected = detectBranchInfoColumns(sheetHeaders.map((h) => h.name));

    for (let r = headerRowIdx + 1; r <= range.e.r; r++) {
      const fields: Record<string, string> = {};
      let nonEmptyCount = 0;
      let singleNonEmptyText = '';
      let singleNonEmptyColName = '';

      for (const h of sheetHeaders) {
        const addr = XLSX.utils.encode_cell({ r, c: h.colIdx });
        const val = extractCellString(sheet[addr]);
        if (val !== '') {
          nonEmptyCount++;
          singleNonEmptyText = val;
          singleNonEmptyColName = h.name;
        }
        fields[h.name] = val;
      }

      if (nonEmptyCount === 0) {
        emptyRowsSkipped++;
        continue;
      }

      // Detect bottom operational note rows (single non-empty cell in a multi-column table that is a sentence/note, not a named branch)
      const isNoteRow =
        sheetHeaders.length >= 2 &&
        nonEmptyCount === 1 &&
        singleNonEmptyColName !== localDetected.snCol &&
        !/\bbranch\b/i.test(singleNonEmptyText);

      if (isNoteRow) {
        if (!extractedNotes.includes(singleNonEmptyText)) {
          extractedNotes.push(singleNonEmptyText);
        }
        continue;
      }

      rawRecords.push({
        _rowKey: `bimp-${rawRecords.length + 1}`,
        _sheetName: sheetName,
        fields,
      });
    }
  }

  if (orderedColumns.length === 0 || rawRecords.length === 0) {
    throw new Error(
      'No branch records could be extracted. Please check that your Excel/CSV file contains column headers and at least one branch row.'
    );
  }

  const detectedColumns = detectBranchInfoColumns(orderedColumns);

  // Deduplicate ONLY exact duplicate rows across all columns
  const seenSignatures = new Set<string>();
  const dedupedRecords: BranchInfoRecord[] = [];
  let duplicatesRemoved = 0;

  for (const rec of rawRecords) {
    const normalizedFields: Record<string, string> = {};
    for (const col of orderedColumns) {
      normalizedFields[col] = rec.fields[col] ?? '';
    }
    rec.fields = normalizedFields;

    const sig = orderedColumns
      .map((c) => (normalizedFields[c] || '').trim().toLowerCase())
      .join('|');

    if (seenSignatures.has(sig)) {
      duplicatesRemoved++;
      continue;
    }
    seenSignatures.add(sig);
    dedupedRecords.push(rec);
  }

  if (duplicatesRemoved > 0) {
    warnings.push(
      `${duplicatesRemoved} exact duplicate row${duplicatesRemoved > 1 ? 's were' : ' was'} automatically skipped.`
    );
  }

  // Build diff summary against existingRecords
  const getIdentityKey = (rec: BranchInfoRecord): string => {
    const branch = detectedColumns.branchNameCol
      ? (rec.fields[detectedColumns.branchNameCol] || '').trim().toLowerCase()
      : '';
    const sn = detectedColumns.snCol
      ? (rec.fields[detectedColumns.snCol] || '').trim().toLowerCase()
      : '';
    const phone = detectedColumns.phoneCol
      ? (rec.fields[detectedColumns.phoneCol] || '').trim().toLowerCase()
      : '';
    return `${sn}|${branch}|${phone}`;
  };

  const existingMap = new Map<string, BranchInfoRecord>();
  existingRecords.forEach((r) => existingMap.set(getIdentityKey(r), r));

  let newRecords = 0;
  let updatedRecords = 0;
  let unchangedRecords = 0;

  dedupedRecords.forEach((rec) => {
    const prev = existingMap.get(getIdentityKey(rec));
    if (!prev) {
      newRecords++;
    } else {
      const identical = orderedColumns.every(
        (col) => (prev.fields[col] || '') === (rec.fields[col] || '')
      );
      if (identical) unchangedRecords++;
      else updatedRecords++;
    }
  });

  const filterConfigs = buildBranchFilterConfigs(
    orderedColumns,
    dedupedRecords,
    detectedColumns
  );

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    columns: orderedColumns,
    detectedColumns,
    filterConfigs,
    records: dedupedRecords,
    notes: extractedNotes,
    diff: {
      newRecords,
      updatedRecords,
      unchangedRecords,
      duplicatesRemoved,
      emptyRowsSkipped,
    },
    warnings,
  };
}

export function exportBranchInfoToExcel(
  records: BranchInfoRecord[],
  columns: string[],
  fileNamePrefix = 'EcoDrive_Branch_Information'
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Branch Information');

  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileNamePrefix}_${dateTag}.xlsx`);
}

export function exportBranchInfoToCSV(
  records: BranchInfoRecord[],
  columns: string[],
  fileNamePrefix = 'EcoDrive_Branch_Information'
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
