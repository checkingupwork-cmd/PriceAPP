export interface InstructorRecord {
  /** Internal unique row key for React rendering */
  _rowKey: string;
  /** Worksheet name this record came from */
  _sheetName: string;
  /** Exact column header -> exact string value from Excel/CSV */
  fields: Record<string, string>;
}

export interface DetectedInstructorColumns {
  idCol: string | null;
  nameCol: string | null;
  branchCol: string | null;
  phoneCol: string | null;
  nationalityCol: string | null;
  statusCol: string | null;
  categoryCol: string | null;
  languageCol: string | null;
}

export interface InstructorsDataset {
  fileName: string;
  sheetNames: string[];
  columns: string[];
  detectedColumns: DetectedInstructorColumns;
  records: InstructorRecord[];
  isDefaultSource: boolean;
  importedAt: string;
}

export interface ExcelImportPreview {
  fileName: string;
  sheetNames: string[];
  columns: string[];
  detectedColumns: DetectedInstructorColumns;
  records: InstructorRecord[];
  totalRawRows: number;
  duplicatesRemoved: number;
  emptyRowsSkipped: number;
  warnings: string[];
}
