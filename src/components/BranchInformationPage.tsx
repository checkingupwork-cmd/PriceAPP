import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Search,
  X,
  Filter,
  RotateCcw,
  Phone,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  MapPin,
  ExternalLink,
  Clock,
  LayoutGrid,
  Table2,
  Info,
} from 'lucide-react';
import {
  BranchInfoDataset,
  BranchInfoImportPreview,
  BranchInfoRecord,
} from '../types/branchInfo';
import {
  buildGoogleMapsHref,
  exportBranchInfoToCSV,
  exportBranchInfoToExcel,
  getDefaultBranchInfoDataset,
  parseBranchInfoWorkbook,
} from '../services/branchInfoService';

interface BranchInformationPageProps {
  onShowToast?: (message: string) => void;
}

export const BranchInformationPage: React.FC<BranchInformationPageProps> = ({
  onShowToast,
}) => {
  // 1. Active Excel Dataset (exclusive source of truth)
  const [dataset, setDataset] = useState<BranchInfoDataset>(() =>
    getDefaultBranchInfoDataset()
  );

  // 2. Detail view & layout mode state
  const [selectedBranch, setSelectedBranch] = useState<BranchInfoRecord | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // 3. Dynamic Search & Per-Column Filter State (rebuilt automatically from Excel columns)
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // 4. Excel Upload & Preview States
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<BranchInfoImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5. Copy confirmation feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  const handleCopyText = async (text: string, key: string, toastMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify(toastMsg);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      notify('Unable to copy to clipboard');
    }
  };

  const formatValue = (val: string | undefined): string => {
    const t = (val ?? '').trim();
    return t !== '' ? t : 'Not Available';
  };

  const isEmpty = (val: string | undefined): boolean => {
    return (val ?? '').trim() === '';
  };

  const cols = dataset.detectedColumns;

  const getBranchTitle = (branch: BranchInfoRecord): string => {
    if (cols.branchNameCol) {
      return formatValue(branch.fields[cols.branchNameCol]);
    }
    const firstCol = dataset.columns[0];
    return firstCol ? formatValue(branch.fields[firstCol]) : 'Branch';
  };

  const getBranchSn = (branch: BranchInfoRecord): string => {
    return cols.snCol ? (branch.fields[cols.snCol] || '').trim() : '';
  };

  const getBranchPhone = (branch: BranchInfoRecord): string => {
    return cols.phoneCol ? (branch.fields[cols.phoneCol] || '').trim() : '';
  };

  const getBranchLocation = (branch: BranchInfoRecord): string => {
    const addr = cols.addressCol ? (branch.fields[cols.addressCol] || '').trim() : '';
    const loc = cols.locationCol ? (branch.fields[cols.locationCol] || '').trim() : '';
    return addr || loc;
  };

  const buildBranchCopyText = (branch: BranchInfoRecord): string => {
    return dataset.columns
      .map((col) => `${col}: ${formatValue(branch.fields[col])}`)
      .join('\n');
  };

  const updateColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    Object.values(columnFilters).some((v) => v.trim() !== '' && v !== 'All');

  // Instant AND filtering across global search + all dynamic Excel parameter filters
  const filteredBranches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return dataset.records.filter((rec) => {
      // 1. Global search across all columns
      if (q) {
        const matchesAnyCol = dataset.columns.some((col) =>
          (rec.fields[col] || '').toLowerCase().includes(q)
        );
        if (!matchesAnyCol) return false;
      }

      // 2. Dynamic column filters (AND logic)
      for (const cfg of dataset.filterConfigs) {
        const filterVal = (columnFilters[cfg.column] || '').trim();
        if (!filterVal || filterVal === 'All') continue;

        const cellVal = (rec.fields[cfg.column] || '').trim();
        if (cfg.kind === 'select') {
          if (cellVal !== filterVal) return false;
        } else {
          // For phone numbers, allow space-insensitive partial match too
          const normCell = cellVal.toLowerCase();
          const normFilter = filterVal.toLowerCase();
          if (cfg.column === cols.phoneCol) {
            const compactCell = normCell.replace(/\s+/g, '');
            const compactFilter = normFilter.replace(/\s+/g, '');
            if (!compactCell.includes(compactFilter)) return false;
          } else {
            if (!normCell.includes(normFilter)) return false;
          }
        }
      }

      return true;
    });
  }, [dataset.records, dataset.columns, dataset.filterConfigs, cols.phoneCol, searchQuery, columnFilters]);

  // Excel Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const preview = await parseBranchInfoWorkbook(file, dataset.records);
      setImportPreview(preview);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Failed to read the uploaded Excel file.'
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    setDataset({
      fileName: importPreview.fileName,
      sheetNames: importPreview.sheetNames,
      columns: importPreview.columns,
      detectedColumns: importPreview.detectedColumns,
      filterConfigs: importPreview.filterConfigs,
      records: importPreview.records,
      notes: importPreview.notes,
      isDefaultSource: false,
      importedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    setSelectedBranch(null);
    handleClearFilters();
    setImportPreview(null);
    setImportError(null);
    setShowImportPanel(false);
    notify(
      `Imported ${importPreview.records.length} branch records from ${importPreview.fileName}`
    );
  };

  const handleRefreshData = () => {
    const def = getDefaultBranchInfoDataset();
    setDataset(def);
    setSelectedBranch(null);
    handleClearFilters();
    setImportPreview(null);
    setImportError(null);
    notify('Refreshed Branch Information from source file');
  };

  // =========================================================
  // BRANCH DETAILS VIEW
  // =========================================================
  if (selectedBranch) {
    const branchTitle = getBranchTitle(selectedBranch);
    const branchSn = getBranchSn(selectedBranch);
    const branchPhone = getBranchPhone(selectedBranch);
    const branchLocation = getBranchLocation(selectedBranch);
    const mapHref = cols.mapLinkCol
      ? buildGoogleMapsHref(selectedBranch.fields[cols.mapLinkCol])
      : null;

    const generalCols = [
      cols.branchNameCol,
      cols.snCol,
      cols.branchCodeCol,
      cols.branchTypeCol,
      cols.departmentCol,
      cols.statusCol,
    ].filter((c): c is string => Boolean(c));

    const contactCols = [cols.phoneCol, cols.emailCol].filter((c): c is string =>
      Boolean(c)
    );

    const locationCols = [cols.locationCol, cols.addressCol, cols.mapLinkCol].filter(
      (c): c is string => Boolean(c)
    );

    const managementCols = [cols.managerCol].filter((c): c is string => Boolean(c));
    const workingHoursCols = [cols.workingHoursCol].filter((c): c is string => Boolean(c));

    const handledCols = new Set<string>([
      ...generalCols,
      ...contactCols,
      ...locationCols,
      ...managementCols,
      ...workingHoursCols,
    ]);
    const additionalCols = dataset.columns.filter((c) => !handledCols.has(c));

    return (
      <div className="space-y-6">
        {/* Back Button & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedBranch(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] hover:text-[#006B45] text-xs font-bold shadow-2xs transition-colors w-max"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Branch Information</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {branchPhone && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    branchPhone,
                    `det-phone-${selectedBranch._rowKey}`,
                    `Copied contact number: ${branchPhone}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] text-xs font-semibold shadow-2xs transition-colors"
              >
                {copiedKey === `det-phone-${selectedBranch._rowKey}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-[#006B45]" />
                )}
                <span>Copy Contact Number</span>
              </button>
            )}

            {branchLocation && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    branchLocation,
                    `det-loc-${selectedBranch._rowKey}`,
                    'Copied branch location'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] text-xs font-semibold shadow-2xs transition-colors"
              >
                {copiedKey === `det-loc-${selectedBranch._rowKey}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#006B45]" />
                )}
                <span>Copy Branch Address</span>
              </button>
            )}

            {mapHref && (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#006B45] text-xs font-semibold shadow-2xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 text-[#64748B]" />
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  buildBranchCopyText(selectedBranch),
                  `det-info-${selectedBranch._rowKey}`,
                  `Copied information for ${branchTitle}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006B45] hover:bg-[#064E3B] text-white text-xs font-bold shadow-xs transition-colors"
            >
              {copiedKey === `det-info-${selectedBranch._rowKey}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>Copy Branch Information</span>
            </button>
          </div>
        </div>

        {/* Branch Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-[#064E3B] to-[#006B45] text-white p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-emerald-200" />
                </div>
                <div>
                  {branchSn && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 font-mono mb-1">
                      S No. #{branchSn}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {branchTitle}
                  </h2>
                </div>
              </div>

              <div className="bg-black/20 px-3.5 py-2.5 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
                <span className="block text-emerald-200/80 text-[10px] uppercase font-bold tracking-wider">
                  {cols.phoneCol || 'Contact Number'}
                </span>
                <span className="font-mono font-extrabold text-sm text-white">
                  {branchPhone || 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* General Information */}
            {generalCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>General Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {generalCols.map((col) => (
                    <div
                      key={col}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        {col}
                      </span>
                      <span
                        className={`mt-1 block text-sm font-bold ${
                          isEmpty(selectedBranch.fields[col])
                            ? 'text-[#94A3B8] italic font-medium'
                            : 'text-[#0F172A]'
                        }`}
                      >
                        {formatValue(selectedBranch.fields[col])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {contactCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contactCols.map((col) => {
                    const val = (selectedBranch.fields[col] || '').trim();
                    return (
                      <div
                        key={col}
                        className="bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl p-3.5 flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#064E3B]/70">
                            {col}
                          </span>
                          <span
                            className={`mt-1 block text-sm font-extrabold ${
                              val
                                ? 'text-[#064E3B] font-mono'
                                : 'text-[#94A3B8] italic font-medium'
                            }`}
                          >
                            {formatValue(val)}
                          </span>
                        </div>
                        {val && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(val, `cc-${col}`, `Copied ${col}: ${val}`)
                            }
                            className="p-2 rounded-lg bg-white border border-[#D1FAE5] hover:border-[#006B45] text-[#006B45] transition-colors shrink-0"
                            title={`Copy ${col}`}
                          >
                            {copiedKey === `cc-${col}` ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Details */}
            {locationCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Location Details</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {locationCols.map((col) => {
                    const val = (selectedBranch.fields[col] || '').trim();
                    return (
                      <div
                        key={col}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-start justify-between gap-3"
                      >
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                            {col}
                          </span>
                          <span
                            className={`mt-1 block text-sm font-bold break-words ${
                              val ? 'text-[#0F172A]' : 'text-[#94A3B8] italic font-medium'
                            }`}
                          >
                            {formatValue(val)}
                          </span>
                        </div>
                        {val && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(val, `loc-${col}`, `Copied ${col}`)
                            }
                            className="p-2 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#64748B] hover:text-[#006B45] transition-colors shrink-0"
                            title={`Copy ${col}`}
                          >
                            {copiedKey === `loc-${col}` ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Management Information (Only if column exists in uploaded file) */}
            {managementCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Management Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {managementCols.map((col) => (
                    <div
                      key={col}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        {col}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-[#0F172A]">
                        {formatValue(selectedBranch.fields[col])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Working Hours (Only if column exists in uploaded file) */}
            {workingHoursCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Working Hours</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workingHoursCols.map((col) => (
                    <div
                      key={col}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        {col}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-[#0F172A]">
                        {formatValue(selectedBranch.fields[col])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information (Any other Excel columns) */}
            {additionalCols.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#006B45] mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>Additional Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {additionalCols.map((col) => (
                    <div
                      key={col}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        {col}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-[#0F172A] break-words">
                        {formatValue(selectedBranch.fields[col])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DIRECTORY VIEW
  // =========================================================
  return (
    <div className="space-y-6">
      {/* 1. Source Banner & Quick Actions Header */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#006B45] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <FileSpreadsheet className="w-3 h-3" />
                  Excel Source Active
                </span>
                <span className="text-[11px] text-emerald-100/80 font-medium">
                  {dataset.sheetNames.length} worksheet{dataset.sheetNames.length > 1 ? 's' : ''} · {dataset.columns.length} columns · {dataset.records.length} branches
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 break-all">
                {dataset.fileName}
              </h2>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowImportPanel((prev) => !prev);
                setImportError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#064E3B] text-xs font-extrabold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{showImportPanel ? 'Close Upload' : 'Upload Updated Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportBranchInfoToExcel(filteredBranches, dataset.columns);
                notify(`Exported ${filteredBranches.length} branch records to Excel (.xlsx)`);
              }}
              disabled={filteredBranches.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold border border-white/15 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportBranchInfoToCSV(filteredBranches, dataset.columns);
                notify(`Exported ${filteredBranches.length} branch records to CSV`);
              }}
              disabled={filteredBranches.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold border border-white/15 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/25 hover:bg-black/35 text-emerald-100 text-xs font-semibold border border-white/10 transition-colors"
              title="Refresh branch data from source file"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span>Refresh Branch Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Excel Upload & Diff Preview Panel */}
      {showImportPanel && (
        <div className="bg-white rounded-2xl border-2 border-[#006B45]/30 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Upload Updated Branch Information Excel / CSV
                </h3>
                <p className="text-xs text-[#64748B]">
                  Reads all worksheets (.xlsx, .xls, .csv), rebuilds filters from its columns, and previews changes before applying.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowImportPanel(false);
                setImportError(null);
                setImportPreview(null);
              }}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 self-end sm:self-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="branch-info-excel-upload"
            />
            <label
              htmlFor="branch-info-excel-upload"
              className="cursor-pointer border-2 border-dashed border-[#CBD5E1] hover:border-[#006B45] bg-[#F8FAFC] hover:bg-[#F0FDF4]/50 rounded-xl p-4 flex items-center justify-center gap-3 transition-colors"
            >
              <Upload className="w-5 h-5 text-[#006B45] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#0F172A] block">
                  {isParsingFile
                    ? 'Reading worksheets and analyzing branch records...'
                    : 'Click to select an Excel (.xlsx, .xls) or CSV file'}
                </span>
                <span className="text-[#64748B]">
                  Preserves exact column headers, contact numbers, and locations
                </span>
              </div>
            </label>
          </div>

          {importError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Import Validation Failed</span>
                <span>{importError}</span>
              </div>
            </div>
          )}

          {importPreview && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#064E3B]">
                    <CheckCircle2 className="w-4 h-4 text-[#006B45]" />
                    <span>Preview Ready: {importPreview.fileName}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {importPreview.records.length} branches across{' '}
                    {importPreview.sheetNames.length} worksheet(s) ({importPreview.sheetNames.join(', ')})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-4 py-2 rounded-xl bg-[#006B45] hover:bg-[#064E3B] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Confirm Import ({importPreview.records.length} Records)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                    New Records
                  </span>
                  <span className="font-extrabold text-emerald-900 text-sm">
                    {importPreview.diff.newRecords}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">
                    Updated Records
                  </span>
                  <span className="font-extrabold text-amber-900 text-sm">
                    {importPreview.diff.updatedRecords}
                  </span>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                  <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                    Unchanged
                  </span>
                  <span className="font-extrabold text-[#0F172A] text-sm">
                    {importPreview.diff.unchangedRecords}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">
                    Duplicates Skipped
                  </span>
                  <span className="font-extrabold text-rose-900 text-sm">
                    {importPreview.diff.duplicatesRemoved}
                  </span>
                </div>
              </div>

              {importPreview.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  {importPreview.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto bg-white rounded-lg border border-[#E2E8F0]">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569] font-bold">
                      {importPreview.columns.map((col) => (
                        <th key={col} className="py-2 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {importPreview.records.slice(0, 5).map((row) => (
                      <tr key={row._rowKey}>
                        {importPreview.columns.map((col) => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap">
                            {isEmpty(row.fields[col]) ? (
                              <span className="text-[#94A3B8] italic">Not Available</span>
                            ) : (
                              <span className="text-[#0F172A]">{row.fields[col]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#006B45] shrink-0" />
                <span>
                  Confirming updates the active session view with this file&apos;s data (changes are not permanently stored in a remote database).
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Dynamic Branch Information Filters (Built strictly from active Excel columns) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#006B45] flex items-center justify-center border border-[#D1FAE5]">
              <Filter className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Search &amp; Filter Branch Information
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B]">
              Showing <strong className="text-[#0F172A]">{filteredBranches.length}</strong> of{' '}
              {dataset.records.length} branches
            </span>

            <div className="inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#006B45] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#006B45] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#006B45]" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Prominent Global Search Bar */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#006B45]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search across ${dataset.columns.join(', ')}...`}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Parameter Filters — generated directly from the Excel columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dataset.filterConfigs.map((cfg) => {
            const currentVal = columnFilters[cfg.column] || (cfg.kind === 'select' ? 'All' : '');

            if (cfg.kind === 'select') {
              return (
                <div key={cfg.column}>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                    {cfg.label}
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) => updateColumnFilter(cfg.column, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
                  >
                    <option value="All">
                      All {cfg.label} ({cfg.options.length})
                    </option>
                    {cfg.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value} ({opt.count})
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={cfg.column}>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  {cfg.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => updateColumnFilter(cfg.column, e.target.value)}
                    placeholder={`Filter by ${cfg.label}...`}
                    className="w-full px-3 pr-7 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45]"
                  />
                  {currentVal && (
                    <button
                      type="button"
                      onClick={() => updateColumnFilter(cfg.column, '')}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Branch Information Display (Cards or Table) */}
      {filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No Matching Branches Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
            No branch record matches your current search or filter criteria.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-[#006B45] text-white text-xs font-semibold rounded-xl hover:bg-[#064E3B] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const branchTitle = getBranchTitle(branch);
            const branchSn = getBranchSn(branch);
            const branchPhone = getBranchPhone(branch);
            const branchLocation = getBranchLocation(branch);
            const mapHref = cols.mapLinkCol
              ? buildGoogleMapsHref(branch.fields[cols.mapLinkCol])
              : null;

            const shownCols = new Set(
              [
                cols.snCol,
                cols.branchNameCol,
                cols.phoneCol,
                cols.locationCol,
                cols.addressCol,
                cols.mapLinkCol,
              ].filter(Boolean) as string[]
            );
            const extraCardCols = dataset.columns.filter((c) => !shownCols.has(c));

            return (
              <div
                key={branch._rowKey}
                onClick={() => setSelectedBranch(branch)}
                className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#006B45]/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {cols.snCol && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] font-mono font-bold text-[10px] mb-1.5">
                          {branchSn ? `S No. #${branchSn}` : 'S No. Not Available'}
                        </span>
                      )}
                      <h4 className="text-base font-extrabold text-[#0F172A] group-hover:text-[#006B45] transition-colors">
                        {branchTitle}
                      </h4>
                    </div>
                  </div>

                  {/* Contact Number */}
                  {cols.phoneCol && (
                    <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <Phone className="w-3.5 h-3.5 text-[#006B45] shrink-0" />
                        <span className="text-[#064E3B]/80 font-semibold shrink-0">
                          {cols.phoneCol}:
                        </span>
                        <span
                          className={`truncate ${
                            branchPhone
                              ? 'font-mono font-extrabold text-[#064E3B]'
                              : 'italic text-[#64748B]'
                          }`}
                        >
                          {branchPhone || 'Not Available'}
                        </span>
                      </div>
                      {branchPhone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(
                              branchPhone,
                              `card-ph-${branch._rowKey}`,
                              `Copied ${cols.phoneCol}: ${branchPhone}`
                            );
                          }}
                          className="p-1 rounded-md hover:bg-emerald-200/50 text-[#006B45] shrink-0"
                          title="Copy Contact Number"
                        >
                          {copiedKey === `card-ph-${branch._rowKey}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Location / Address */}
                  {(cols.locationCol || cols.addressCol) && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#006B45] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                            {cols.locationCol || cols.addressCol}
                          </span>
                          <span
                            className={`mt-0.5 block break-words leading-relaxed ${
                              branchLocation
                                ? 'text-[#0F172A] font-medium'
                                : 'text-[#94A3B8] italic'
                            }`}
                          >
                            {branchLocation || 'Not Available'}
                          </span>
                        </div>
                      </div>
                      {branchLocation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(
                              branchLocation,
                              `card-loc-${branch._rowKey}`,
                              'Copied branch location'
                            );
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-[#64748B] hover:text-[#006B45] shrink-0"
                          title="Copy Location"
                        >
                          {copiedKey === `card-loc-${branch._rowKey}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Any Additional Columns (if present in uploaded Excel) */}
                  {extraCardCols.length > 0 && (
                    <div className="grid grid-cols-1 gap-1.5 text-xs pt-1">
                      {extraCardCols.map((col) => (
                        <div
                          key={col}
                          className="flex items-center justify-between gap-2 text-[11px] bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]"
                        >
                          <span className="font-semibold text-[#64748B]">{col}:</span>
                          <span
                            className={
                              isEmpty(branch.fields[col])
                                ? 'italic text-[#94A3B8]'
                                : 'font-bold text-[#0F172A] truncate'
                            }
                          >
                            {formatValue(branch.fields[col])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Quick Actions Footer */}
                <div
                  className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          buildBranchCopyText(branch),
                          `card-info-${branch._rowKey}`,
                          `Copied ${branchTitle} info`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] hover:text-[#006B45] text-[11px] font-semibold transition-colors"
                      title="Copy Branch Information"
                    >
                      {copiedKey === `card-info-${branch._rowKey}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#006B45]" />
                      )}
                      <span>Copy Info</span>
                    </button>

                    {branchPhone && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            branchPhone,
                            `card-cph-${branch._rowKey}`,
                            `Copied contact: ${branchPhone}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] hover:text-[#006B45] text-[11px] font-semibold transition-colors"
                        title="Copy Contact Number"
                      >
                        <Phone className="w-3 h-3 text-[#006B45]" />
                        <span>Number</span>
                      </button>
                    )}

                    {mapHref && (
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#006B45] text-[11px] font-semibold transition-colors"
                        title="Open in Google Maps"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Map</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBranch(branch)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#006B45] hover:bg-[#064E3B] text-white text-[11px] font-semibold transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Table View */
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-[11px] uppercase tracking-wider">
                  {dataset.columns.map((col) => (
                    <th key={col} className="py-3.5 px-4 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredBranches.map((branch, idx) => {
                  const branchPhone = getBranchPhone(branch);
                  return (
                    <tr
                      key={branch._rowKey}
                      onClick={() => setSelectedBranch(branch)}
                      className={`cursor-pointer transition-colors ${
                        idx % 2 === 0
                          ? 'bg-white hover:bg-emerald-50/40'
                          : 'bg-[#FAFAFA] hover:bg-emerald-50/40'
                      }`}
                    >
                      {dataset.columns.map((col) => {
                        const val = branch.fields[col];
                        const isNameCol = cols.branchNameCol === col;
                        const isPhoneCol = cols.phoneCol === col;
                        return (
                          <td
                            key={col}
                            className={`py-3.5 px-4 ${
                              col === cols.locationCol || col === cols.addressCol
                                ? 'min-w-[240px]'
                                : 'whitespace-nowrap'
                            }`}
                          >
                            {isEmpty(val) ? (
                              <span className="text-[#94A3B8] italic">Not Available</span>
                            ) : isNameCol ? (
                              <span className="font-extrabold text-[#006B45] hover:underline">
                                {val}
                              </span>
                            ) : isPhoneCol ? (
                              <span className="font-mono font-semibold text-[#0F172A]">
                                {val}
                              </span>
                            ) : (
                              <span className="text-[#0F172A] font-medium">{val}</span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {branchPhone && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  branchPhone,
                                  `tbl-ph-${branch._rowKey}`,
                                  `Copied contact: ${branchPhone}`
                                )
                              }
                              className="px-2 py-1 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#006B45] text-[11px] font-semibold text-[#0F172A]"
                            >
                              Copy #
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBranch(branch)}
                            className="px-2.5 py-1 rounded-lg bg-[#006B45] hover:bg-[#064E3B] text-white text-[11px] font-semibold"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Branch & Training Operational Notes (Extracted from Excel sheet) */}
      {dataset.notes.length > 0 && (
        <div className="bg-[#F0FDF4] border border-[#D1FAE5] rounded-2xl p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#064E3B]">
            <Info className="w-4 h-4 text-[#006B45]" />
            <span>Additional Notes from Branch List</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#064E3B]">
            {dataset.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006B45] mt-1.5 shrink-0" />
                <span className="font-medium leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
