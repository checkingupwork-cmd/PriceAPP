export type CategoryCode = 'LMV' | 'MOT' | 'HVB' | 'HVT' | 'HME';

export interface CategoryMetadata {
  code: CategoryCode;
  name: string;
  fullName: string;
  description: string;
  applicableFeeTypes: string[];
  badgeColor: string;
}

export type FeeType = 'REGULAR' | 'FLEXI' | 'LUMPSUM (Absent)';

export interface NormalizedPriceRecord {
  id: string;
  serviceName: string;
  category: CategoryCode;
  feeType: FeeType;
  price: number | null; // null represents blank / not available, NEVER 0
  serviceGroup?: string;
}

export interface SheetColumnHeader {
  key: string;
  category: CategoryCode;
  feeType: FeeType;
  headerLabel: string;
}

export interface RawMatrixRow {
  serviceName: string;
  prices: Record<string, number | null>; // key is `${category}_${feeType}`
}

export interface DataSourceState {
  type: 'default_sheet' | 'google_sheet_url' | 'imported_file';
  sourceName: string;
  lastSyncTimestamp: string;
  googleSheetUrl?: string;
  totalServicesCount: number;
  totalPricePointsCount: number;
  availablePricesCount: number;
  syncError?: string | null;
}
