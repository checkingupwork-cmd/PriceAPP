export type TrafficZone = 'Green' | 'Yellow' | 'Red';

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'NOT_AVAILABLE'
  | 'MANUAL_CONFIRMATION_REQUIRED';

export interface BranchRecord {
  id: string;
  name: string;
  zone: TrafficZone;
  locationUrl: string;
  comment: string;
  hasRestrictions: boolean;
}

export interface LiveBranchStatus {
  status: AvailabilityStatus;
  statusLabel: string;
  reason: string;
  isRestrictedNow: boolean;
}

export interface CustomCheckResult {
  branch: BranchRecord;
  selectedDate: string;
  selectedDateFormatted: string;
  selectedWeekday: string;
  selectedTime: string;
  selectedTimeFormatted: string;
  status: AvailabilityStatus;
  statusLabel: string;
  explanation: string;
  comment: string;
}
