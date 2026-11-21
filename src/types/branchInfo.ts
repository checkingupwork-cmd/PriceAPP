export interface BranchInfoRecord {
  _rowKey: string;
  _sheetName: string;
  /** Exact Excel column header -> exact string value */
  fields: Record<string, string>;
}

export type DynamicFilterKind = 'select' | 'text';

export interface DynamicBranchFilterConfig {
  column: string;
  label: string;
  kind: DynamicFilterKind;
  options: { value: string; count: number }[];
}

export interface DetectedBranchInfoColumns {
  snCol: string | null;
  branchNameCol: string | null;
  phoneCol: string | null;
  locationCol: string | null;
  addressCol: string | null;
  mapLinkCol: string | null;
  branchCodeCol: string | null;
  branchTypeCol: string | null;
  managerCol: string | null;
  departmentCol: string | null;
  statusCol: string | null;
  emailCol: string | null;
  workingHoursCol: string | null;
}

export interface BranchInfoDataset {
  fileName: string;
  sheetNames: string[];
  columns: string[];
  detectedColumns: DetectedBranchInfoColumns;
  filterConfigs: DynamicBranchFilterConfig[];
  records: BranchInfoRecord[];
  notes: string[];
  isDefaultSource: boolean;
  importedAt: string;
}

export interface BranchImportDiffSummary {
  newRecords: number;
  updatedRecords: number;
  unchangedRecords: number;
  duplicatesRemoved: number;
  emptyRowsSkipped: number;
}

export interface BranchInfoImportPreview {
  fileName: string;
  sheetNames: string[];
  columns: string[];
  detectedColumns: DetectedBranchInfoColumns;
  filterConfigs: DynamicBranchFilterConfig[];
  records: BranchInfoRecord[];
  notes: string[];
  diff: BranchImportDiffSummary;
  warnings: string[];
}
