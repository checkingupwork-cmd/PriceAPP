import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  X,
  Filter,
  RotateCcw,
  Building2,
  Phone,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Eye,
  Globe,
  RefreshCw,
  UserCheck,
  UserX,
  Info,
} from 'lucide-react';
import {
  ExcelImportPreview,
  InstructorRecord,
  InstructorsDataset,
} from '../types/instructors';
import {
  exportInstructorsToCSV,
  exportInstructorsToExcel,
  getDefaultInstructorsDataset,
  parseInstructorsWorkbook,
} from '../services/instructorsService';

interface InstructorsPageProps {
  onShowToast?: (message: string) => void;
}

type SortDirection = 'asc' | 'desc';

export const InstructorsPage: React.FC<InstructorsPageProps> = ({ onShowToast }) => {
  // 1. Active Dataset State (initialized from uploaded source file)
  const [dataset, setDataset] = useState<InstructorsDataset>(() =>
    getDefaultInstructorsDataset()
  );

  // 2. Detail View State
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorRecord | null>(null);

  // 3. Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [nationalityFilter, setNationalityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');

  // 4. Sorting & Pagination States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // 5. Excel Import & Preview States
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 6. Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    }
  };

  const handleCopyText = async (text: string, key: string, toastLabel: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify(toastLabel);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      notify('Unable to copy to clipboard');
    }
  };

  const formatCellDisplay = (value: string | undefined): string => {
    const trimmed = (value ?? '').trim();
    return trimmed !== '' ? trimmed : 'Not Available';
  };

  const isCellEmpty = (value: string | undefined): boolean => {
    return (value ?? '').trim() === '';
  };

  const buildInstructorCopyText = (record: InstructorRecord): string => {
    return dataset.columns
      .map((col) => `${col}: ${formatCellDisplay(record.fields[col])}`)
      .join('\n');
  };

  // Detected columns from current dataset
  const cols = dataset.detectedColumns;

  // Automatically populate dropdown options from actual Excel data (only if column exists)
  const filterOptions = useMemo(() => {
    const getUniqueOptions = (colName: string | null) => {
      if (!colName) return [];
      const counts = new Map<string, number>();
      dataset.records.forEach((r) => {
        const val = (r.fields[colName] || '').trim();
        if (val) {
          counts.set(val, (counts.get(val) || 0) + 1);
        }
      });
      return Array.from(counts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count }));
    };

    return {
      branches: getUniqueOptions(cols.branchCol),
      nationalities: getUniqueOptions(cols.nationalityCol),
      statuses: getUniqueOptions(cols.statusCol),
      categories: getUniqueOptions(cols.categoryCol),
      languages: getUniqueOptions(cols.languageCol),
    };
  }, [dataset.records, cols]);

  // Summary statistics calculated reliably from actual dataset
  const summaryStats = useMemo(() => {
    const total = dataset.records.length;

    const branchCount = cols.branchCol
      ? new Set(
          dataset.records
            .map((r) => (r.fields[cols.branchCol!] || '').trim())
            .filter(Boolean)
        ).size
      : null;

    let activeCount: number | null = null;
    let inactiveCount: number | null = null;
    if (cols.statusCol) {
      let active = 0;
      let inactive = 0;
      dataset.records.forEach((r) => {
        const val = (r.fields[cols.statusCol!] || '').trim().toLowerCase();
        if (!val) return;
        if (val === 'active' || val.startsWith('active')) {
          active++;
        } else if (
          val === 'inactive' ||
          val.includes('inactive') ||
          val.includes('terminated') ||
          val.includes('resigned') ||
          val.includes('suspended')
        ) {
          inactive++;
        }
      });
      activeCount = active;
      inactiveCount = inactive;
    }

    return {
      total,
      branchCount,
      activeCount,
      inactiveCount,
    };
  }, [dataset.records, cols]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setIdFilter('');
    setBranchFilter('All');
    setNationalityFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    setLanguageFilter('All');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    idFilter.trim() !== '' ||
    branchFilter !== 'All' ||
    nationalityFilter !== 'All' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    languageFilter !== 'All';

  // Filtered records (partial text, case-insensitive, combined AND logic)
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const idQ = idFilter.trim().toLowerCase();

    return dataset.records.filter((record) => {
      // 1. Main Search Instructor (by Name or ID, or fallback across all fields)
      if (q) {
        const nameVal = cols.nameCol ? (record.fields[cols.nameCol] || '').toLowerCase() : '';
        const idVal = cols.idCol ? (record.fields[cols.idCol] || '').toLowerCase() : '';
        if (cols.nameCol || cols.idCol) {
          if (!nameVal.includes(q) && !idVal.includes(q)) {
            return false;
          }
        } else {
          const anyMatch = dataset.columns.some((c) =>
            (record.fields[c] || '').toLowerCase().includes(q)
          );
          if (!anyMatch) return false;
        }
      }

      // 2. Dedicated Instructor ID filter
      if (idQ && cols.idCol) {
        const idVal = (record.fields[cols.idCol] || '').toLowerCase();
        if (!idVal.includes(idQ)) return false;
      }

      // 3. Branch dropdown
      if (branchFilter !== 'All' && cols.branchCol) {
        if ((record.fields[cols.branchCol] || '').trim() !== branchFilter) return false;
      }

      // 4. Nationality dropdown
      if (nationalityFilter !== 'All' && cols.nationalityCol) {
        if ((record.fields[cols.nationalityCol] || '').trim() !== nationalityFilter) return false;
      }

      // 5. Status dropdown (only if column exists)
      if (statusFilter !== 'All' && cols.statusCol) {
        if ((record.fields[cols.statusCol] || '').trim() !== statusFilter) return false;
      }

      // 6. Category / License dropdown (only if column exists)
      if (categoryFilter !== 'All' && cols.categoryCol) {
        if ((record.fields[cols.categoryCol] || '').trim() !== categoryFilter) return false;
      }

      // 7. Language dropdown (only if column exists)
      if (languageFilter !== 'All' && cols.languageCol) {
        if ((record.fields[cols.languageCol] || '').trim() !== languageFilter) return false;
      }

      return true;
    });
  }, [
    dataset.records,
    dataset.columns,
    cols,
    searchQuery,
    idFilter,
    branchFilter,
    nationalityFilter,
    statusFilter,
    categoryFilter,
    languageFilter,
  ]);

  // Sorted records
  const sortedRecords = useMemo(() => {
    if (!sortColumn) return filteredRecords;

    return [...filteredRecords].sort((a, b) => {
      const valA = (a.fields[sortColumn] || '').trim();
      const valB = (b.fields[sortColumn] || '').trim();

      if (!valA && !valB) return 0;
      if (!valA) return 1;
      if (!valB) return -1;

      // Numeric-aware comparison for IDs / numbers
      const numA = Number(valA);
      const numB = Number(valB);
      let cmp = 0;
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && /^\d+(\.\d+)?$/.test(valA) && /^\d+(\.\d+)?$/.test(valB)) {
        cmp = numA - numB;
      } else {
        cmp = valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredRecords, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, safePage, pageSize]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle Excel / CSV File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const preview = await parseInstructorsWorkbook(file);
      setImportPreview(preview);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Failed to parse the uploaded Excel file.'
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm Import Preview
  const handleConfirmImport = () => {
    if (!importPreview) return;

    setDataset({
      fileName: importPreview.fileName,
      sheetNames: importPreview.sheetNames,
      columns: importPreview.columns,
      detectedColumns: importPreview.detectedColumns,
      records: importPreview.records,
      isDefaultSource: false,
      importedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setSelectedInstructor(null);
    handleClearFilters();
    setSortColumn(null);
    setImportPreview(null);
    setImportError(null);
    setShowImportPanel(false);
    notify(
      `Imported ${importPreview.records.length} instructors from ${importPreview.fileName}`
    );
  };

  // Reset / Re-import Default Source
  const handleResetToSourceFile = () => {
    const defaultData = getDefaultInstructorsDataset();
    setDataset(defaultData);
    setSelectedInstructor(null);
    handleClearFilters();
    setSortColumn(null);
    setImportPreview(null);
    setImportError(null);
    notify('Restored original uploaded instructors file');
  };

  // =========================================================
  // DETAIL VIEW (When clicking an instructor's name or row)
  // =========================================================
  if (selectedInstructor) {
    const instructorName = cols.nameCol
      ? formatCellDisplay(selectedInstructor.fields[cols.nameCol])
      : formatCellDisplay(selectedInstructor.fields[dataset.columns[0]]);
    const instructorId = cols.idCol
      ? formatCellDisplay(selectedInstructor.fields[cols.idCol])
      : null;
    const instructorBranch = cols.branchCol
      ? formatCellDisplay(selectedInstructor.fields[cols.branchCol])
      : null;
    const instructorPhone = cols.phoneCol
      ? (selectedInstructor.fields[cols.phoneCol] || '').trim()
      : '';
    const instructorStatus = cols.statusCol
      ? (selectedInstructor.fields[cols.statusCol] || '').trim()
      : '';

    const initials = instructorName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    return (
      <div className="space-y-6">
        {/* Top Back Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedInstructor(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] hover:text-[#006B45] text-xs font-bold shadow-2xs transition-colors w-max"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Instructors</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {instructorPhone && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    instructorPhone,
                    `detail-phone-${selectedInstructor._rowKey}`,
                    `Copied phone number: ${instructorPhone}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#006B45] text-[#0F172A] text-xs font-semibold shadow-2xs transition-colors"
              >
                {copiedKey === `detail-phone-${selectedInstructor._rowKey}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-[#006B45]" />
                )}
                <span>Copy Phone Number</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  buildInstructorCopyText(selectedInstructor),
                  `detail-info-${selectedInstructor._rowKey}`,
                  `Copied information for ${instructorName}`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006B45] hover:bg-[#064E3B] text-white text-xs font-bold shadow-xs transition-colors"
            >
              {copiedKey === `detail-info-${selectedInstructor._rowKey}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>Copy Instructor Information</span>
            </button>
          </div>
        </div>

        {/* Instructor Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-[#064E3B] to-[#006B45] text-white p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-lg font-extrabold text-white shrink-0">
                  {initials || 'IN'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {instructorId && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-400/30 font-mono">
                        ID: {instructorId}
                      </span>
                    )}
                    {instructorStatus && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25">
                        {instructorStatus}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                    {instructorName}
                  </h2>
                  {instructorBranch && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-100/90 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{instructorBranch}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-emerald-100/80 bg-black/20 px-3 py-2 rounded-xl border border-white/10 self-start sm:self-auto">
                <span className="block font-semibold text-white">Source Record</span>
                <span className="text-[11px]">Worksheet: {selectedInstructor._sheetName}</span>
              </div>
            </div>
          </div>

          {/* All Available Excel Fields Grid */}
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Complete Instructor Information ({dataset.columns.length} Fields)
              </h3>
              <span className="text-[11px] text-[#64748B]">
                Exact values from {dataset.fileName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataset.columns.map((colName) => {
                const rawVal = selectedInstructor.fields[colName];
                const empty = isCellEmpty(rawVal);
                const isPhone = cols.phoneCol === colName;
                const isId = cols.idCol === colName;

                return (
                  <div
                    key={colName}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between gap-2"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      {colName}
                    </span>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-bold break-words ${
                          empty
                            ? 'text-[#94A3B8] italic font-medium'
                            : isId || isPhone
                            ? 'text-[#0F172A] font-mono'
                            : 'text-[#0F172A]'
                        }`}
                      >
                        {formatCellDisplay(rawVal)}
                      </span>

                      {!empty && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              rawVal.trim(),
                              `field-${colName}`,
                              `Copied ${colName}: ${rawVal.trim()}`
                            )
                          }
                          className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#006B45] text-[#64748B] hover:text-[#006B45] transition-colors shrink-0"
                          title={`Copy ${colName}`}
                        >
                          {copiedKey === `field-${colName}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DIRECTORY VIEW
  // =========================================================
  const startIdx = filteredRecords.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, sortedRecords.length);

  return (
    <div className="space-y-6">
      {/* 1. Source Banner & Quick Actions Header */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#006B45] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Users className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  <FileSpreadsheet className="w-3 h-3" />
                  Excel Source Active
                </span>
                <span className="text-[11px] text-emerald-100/80 font-medium">
                  {dataset.sheetNames.length} worksheet{dataset.sheetNames.length > 1 ? 's' : ''} · {dataset.columns.length} columns
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-1 break-all">
                {dataset.fileName}
              </h2>
            </div>
          </div>

          {/* Quick Actions Bar */}
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
              <span>{showImportPanel ? 'Close Import' : 'Import / Update Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportInstructorsToExcel(sortedRecords, dataset.columns);
                notify(`Exported ${sortedRecords.length} instructors to Excel (.xlsx)`);
              }}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold border border-white/15 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportInstructorsToCSV(sortedRecords, dataset.columns);
                notify(`Exported ${sortedRecords.length} instructors to CSV`);
              }}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-semibold border border-white/15 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleResetToSourceFile}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/25 hover:bg-black/35 text-emerald-100 text-xs font-semibold border border-white/10 transition-colors"
              title="Refresh / Re-import original uploaded source data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Excel Import & Preview Panel */}
      {showImportPanel && (
        <div className="bg-white rounded-2xl border-2 border-[#006B45]/30 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Import Instructors Excel / CSV File
                </h3>
                <p className="text-xs text-[#64748B]">
                  Reads all worksheets (.xlsx, .xls, .csv), validates headers, prevents duplicates, and previews data before applying.
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

          {/* File Input Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="instructors-excel-upload"
            />
            <label
              htmlFor="instructors-excel-upload"
              className="flex-1 cursor-pointer border-2 border-dashed border-[#CBD5E1] hover:border-[#006B45] bg-[#F8FAFC] hover:bg-[#F0FDF4]/50 rounded-xl p-4 flex items-center justify-center gap-3 transition-colors"
            >
              <Upload className="w-5 h-5 text-[#006B45] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#0F172A] block">
                  {isParsingFile
                    ? 'Reading worksheets and validating columns...'
                    : 'Click to select an Excel (.xlsx, .xls) or CSV file'}
                </span>
                <span className="text-[#64748B]">
                  All columns and instructor details are preserved verbatim
                </span>
              </div>
            </label>
          </div>

          {/* Import Error */}
          {importError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Import Validation Failed</span>
                <span>{importError}</span>
              </div>
            </div>
          )}

          {/* Import Preview */}
          {importPreview && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#064E3B]">
                    <CheckCircle2 className="w-4 h-4 text-[#006B45]" />
                    <span>Preview Ready: {importPreview.fileName}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {importPreview.records.length} unique records extracted across{' '}
                    {importPreview.sheetNames.length} worksheet(s) (
                    {importPreview.sheetNames.join(', ')})
                    {importPreview.duplicatesRemoved > 0 &&
                      ` · ${importPreview.duplicatesRemoved} duplicates removed`}
                    {importPreview.emptyRowsSkipped > 0 &&
                      ` · ${importPreview.emptyRowsSkipped} empty rows skipped`}
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

              {/* Warnings */}
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

              {/* Detected Columns Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold text-[#0F172A] mr-1">Detected Headers:</span>
                {importPreview.columns.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-md bg-white border border-[#CBD5E1] text-[#0F172A] font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Sample Preview Table (first 5 rows) */}
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
                            {isCellEmpty(row.fields[col]) ? (
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

      {/* 3. Summary Cards (Only displaying statistics reliably calculable from Excel data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Total Instructors
            </span>
            <span className="text-base font-extrabold text-[#0F172A]">
              {summaryStats.total} Instructors
            </span>
          </div>
        </div>

        {summaryStats.activeCount !== null && (
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] block">
                Active Instructors
              </span>
              <span className="text-base font-extrabold text-emerald-700">
                {summaryStats.activeCount} Active
              </span>
            </div>
          </div>
        )}

        {summaryStats.inactiveCount !== null && (
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] block">
                Inactive Instructors
              </span>
              <span className="text-base font-extrabold text-rose-700">
                {summaryStats.inactiveCount} Inactive
              </span>
            </div>
          </div>
        )}

        {summaryStats.branchCount !== null && (
          <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] block">
                Number of Branches
              </span>
              <span className="text-base font-extrabold text-[#0F172A]">
                {summaryStats.branchCount} Branches
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Search & Dynamic Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#006B45] flex items-center justify-center border border-[#D1FAE5]">
              <Filter className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Search &amp; Filter Instructors
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#64748B]">
              Showing <strong className="text-[#0F172A]">{sortedRecords.length}</strong> of{' '}
              {dataset.records.length} instructors
            </span>
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

        {/* Prominent Top Search Bar */}
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
            Search Instructor
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#006B45]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by instructor name or ID (partial match, case-insensitive)..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Filter Controls — Only rendered when corresponding columns exist in the Excel file */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cols.idCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Instructor ID
              </label>
              <input
                type="text"
                value={idFilter}
                onChange={(e) => {
                  setIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Filter by ${cols.idCol}...`}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45]"
              />
            </div>
          )}

          {cols.branchCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Branch
              </label>
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
              >
                <option value="All">All Branches ({filterOptions.branches.length})</option>
                {filterOptions.branches.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {cols.nationalityCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Nationality
              </label>
              <select
                value={nationalityFilter}
                onChange={(e) => {
                  setNationalityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
              >
                <option value="All">
                  All Nationalities ({filterOptions.nationalities.length})
                </option>
                {filterOptions.nationalities.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {cols.statusCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
              >
                <option value="All">All Statuses ({filterOptions.statuses.length})</option>
                {filterOptions.statuses.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {cols.categoryCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Category / License
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
              >
                <option value="All">All Categories ({filterOptions.categories.length})</option>
                {filterOptions.categories.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {cols.languageCol && (
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] font-medium"
              >
                <option value="All">All Languages ({filterOptions.languages.length})</option>
                {filterOptions.languages.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 5. Instructors Results Table */}
      {sortedRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No Matching Instructors Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
            No instructor record matches your current search or filter criteria.
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
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  {dataset.columns.map((col) => {
                    const isSorted = sortColumn === col;
                    return (
                      <th key={col} className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className="inline-flex items-center gap-1.5 hover:text-[#006B45] transition-colors font-bold uppercase tracking-wider text-left"
                        >
                          <span>{col}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#006B45]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#006B45]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-[#94A3B8]" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedRecords.map((item, idx) => {
                  const rowNum = (safePage - 1) * pageSize + idx + 1;
                  const phoneVal = cols.phoneCol ? (item.fields[cols.phoneCol] || '').trim() : '';

                  return (
                    <tr
                      key={item._rowKey}
                      onClick={() => setSelectedInstructor(item)}
                      className={`cursor-pointer transition-colors ${
                        idx % 2 === 0
                          ? 'bg-white hover:bg-emerald-50/40'
                          : 'bg-[#FAFAFA] hover:bg-emerald-50/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-[#64748B] font-semibold">
                        <span className="inline-block min-w-6 px-1.5 h-6 rounded-full bg-slate-100 text-[#475569] leading-6 text-[11px]">
                          {rowNum}
                        </span>
                      </td>

                      {dataset.columns.map((col) => {
                        const val = item.fields[col];
                        const empty = isCellEmpty(val);
                        const isName = cols.nameCol === col;
                        const isId = cols.idCol === col;
                        const isPhone = cols.phoneCol === col;
                        const isBranch = cols.branchCol === col;
                        const isNationality = cols.nationalityCol === col;

                        return (
                          <td key={col} className="py-3.5 px-4 whitespace-nowrap">
                            {empty ? (
                              <span className="text-[#94A3B8] italic">Not Available</span>
                            ) : isName ? (
                              <span className="font-extrabold text-[#006B45] hover:underline text-xs sm:text-sm">
                                {val}
                              </span>
                            ) : isId ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#0F172A] font-mono font-bold text-xs">
                                {val}
                              </span>
                            ) : isPhone ? (
                              <span className="font-mono font-semibold text-[#0F172A] flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#006B45] shrink-0" />
                                <span>{val}</span>
                              </span>
                            ) : isBranch ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDF4] text-[#064E3B] border border-[#D1FAE5] font-semibold text-xs">
                                <Building2 className="w-3 h-3 text-[#006B45] shrink-0" />
                                <span>{val}</span>
                              </span>
                            ) : isNationality ? (
                              <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
                                <Globe className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                                <span>{val}</span>
                              </span>
                            ) : (
                              <span className="text-[#0F172A] font-medium">{val}</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Quick Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {phoneVal && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  phoneVal,
                                  `row-phone-${item._rowKey}`,
                                  `Copied phone: ${phoneVal}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F0FDF4] text-[#0F172A] hover:text-[#006B45] border border-[#CBD5E1] hover:border-[#006B45] text-[11px] font-semibold transition-colors"
                              title="Copy Phone Number"
                            >
                              {copiedKey === `row-phone-${item._rowKey}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Phone className="w-3 h-3 text-[#006B45]" />
                              )}
                              <span className="hidden xl:inline">Phone</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                buildInstructorCopyText(item),
                                `row-info-${item._rowKey}`,
                                `Copied instructor information`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F0FDF4] text-[#0F172A] hover:text-[#006B45] border border-[#CBD5E1] hover:border-[#006B45] text-[11px] font-semibold transition-colors"
                            title="Copy Instructor Information"
                          >
                            {copiedKey === `row-info-${item._rowKey}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-[#006B45]" />
                            )}
                            <span className="hidden xl:inline">Copy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedInstructor(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#006B45] hover:bg-[#064E3B] text-white text-[11px] font-semibold transition-colors"
                            title="View Instructor Details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <strong className="text-[#0F172A]">{startIdx}–{endIdx}</strong> of{' '}
                <strong className="text-[#0F172A]">{sortedRecords.length}</strong> matching instructors
              </span>
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A]"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold disabled:opacity-40 hover:border-[#006B45]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-2.5 font-semibold text-[#0F172A]">
                  Page {safePage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold disabled:opacity-40 hover:border-[#006B45]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
