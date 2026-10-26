import React, { useState } from 'react';
import {
  RefreshCw,
  Link2,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  Database,
} from 'lucide-react';
import { RawMatrixRow, DataSourceState } from '../types/pricing';
import {
  fetchGoogleSheetCsv,
  parseSheetCsv,
  exportMatrixToCsv,
} from '../services/sheetsService';

interface SheetsSyncModalProps {
  matrix: RawMatrixRow[];
  dataSource: DataSourceState;
  onUpdateMatrix: (
    newMatrix: RawMatrixRow[],
    sourceType: 'google_sheet_url' | 'imported_file' | 'default_sheet',
    sourceName: string,
    url?: string
  ) => void;
  onResetToDefault: () => void;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  matrix,
  dataSource,
  onUpdateMatrix,
  onResetToDefault,
}) => {
  const [sheetUrl, setSheetUrl] = useState(dataSource.googleSheetUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  // Paste / File Import State
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Handle Sync with Google Sheet URL
  const handleSyncWithGoogleSheets = async () => {
    if (!sheetUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Please paste a valid Google Sheets URL.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: null });

    try {
      const { matrix: fetchedMatrix, errors } = await fetchGoogleSheetCsv(sheetUrl);

      if (errors.length > 0 && fetchedMatrix.length === 0) {
        setSyncStatus({
          type: 'error',
          message: `Sync failed: ${errors.join(', ')}`,
        });
      } else {
        onUpdateMatrix(
          fetchedMatrix,
          'google_sheet_url',
          'Live Google Sheet Sync',
          sheetUrl
        );
        setSyncStatus({
          type: 'success',
          message: `Successfully synchronized ${fetchedMatrix.length} services from Google Sheet!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus({
        type: 'error',
        message: `Failed to connect: ${msg}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Manual CSV/TSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processCsvContent(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Handle Raw Text Import
  const handleImportTextSubmit = () => {
    if (!importText.trim()) return;
    processCsvContent(importText, 'Manual CSV Text Import');
  };

  const processCsvContent = (content: string, sourceLabel: string) => {
    const { matrix: parsedMatrix, errors } = parseSheetCsv(content);

    if (errors.length > 0 && parsedMatrix.length === 0) {
      setImportErrors(errors);
      setImportSuccess(null);
    } else {
      onUpdateMatrix(parsedMatrix, 'imported_file', sourceLabel);
      setImportErrors(errors);
      setImportSuccess(`Successfully imported ${parsedMatrix.length} service rows.`);
      setImportText('');
    }
  };

  // Export CSV
  const handleDownloadCsv = () => {
    const csvContent = exportMatrixToCsv(matrix);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `driving_school_pricing_backup_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Current Source Status Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Active Source of Truth
              </span>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                {dataSource.sourceName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors"
              title="Reset to official verified price matrix"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Reset to Verified Source</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#064E3B] bg-[#F0FDF4] border border-[#D1FAE5] hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#006B45]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Source Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E2E8F0] text-xs">
          <div>
            <span className="text-[#64748B] block">Total Services</span>
            <span className="font-bold text-[#0F172A] text-sm">{dataSource.totalServicesCount}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Total Combinations</span>
            <span className="font-bold text-[#0F172A] text-sm">{dataSource.totalPricePointsCount}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Available Tariffs</span>
            <span className="font-bold text-[#006B45] text-sm">{dataSource.availablePricesCount}</span>
          </div>
          <div>
            <span className="text-[#64748B] block flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#64748B]" />
              Last Synchronized
            </span>
            <span className="font-medium text-[#0F172A] text-xs truncate block">
              {dataSource.lastSyncTimestamp}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Google Sheets Live URL Sync */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0F172A]">Connect Direct Google Sheet URL</h4>
            <p className="text-xs text-[#64748B]">
              Synchronize price updates directly from your cloud Google Sheet
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0"
            className="flex-1 px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45]"
          />
          <button
            onClick={handleSyncWithGoogleSheets}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006B45] hover:bg-[#064E3B] text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Fetch & Sync Data'}</span>
          </button>
        </div>

        {/* Sync Status Message */}
        {syncStatus.message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
              syncStatus.type === 'success'
                ? 'bg-[#F0FDF4] text-[#064E3B] border border-[#D1FAE5]'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#006B45] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Helpful Google Sheet Configuration Instructions */}
        <div className="bg-[#F8FAFC] rounded-lg p-3.5 border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
          <h5 className="font-semibold text-[#0F172A] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#006B45]" />
            How to configure Google Sheets for instant sync:
          </h5>
          <ol className="list-decimal list-inside space-y-1 text-[#64748B] ml-1">
            <li>Open your Google Sheet price list.</li>
            <li>
              Click <strong>Share</strong> and set General access to{' '}
              <strong>"Anyone with the link can view"</strong>, or choose{' '}
              <strong>File → Share → Publish to web</strong> and select CSV.
            </li>
            <li>Paste the URL above and click <strong>Fetch & Sync Data</strong>.</li>
          </ol>
        </div>
      </div>

      {/* 3. CSV / File Import Option */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0F172A]">Upload or Paste CSV / Spreadsheet Data</h4>
            <p className="text-xs text-[#64748B]">
              Import exported pricing spreadsheets without losing decimal accuracy or blank cells
            </p>
          </div>
        </div>

        {/* File Drop / Select */}
        <div className="border border-dashed border-[#E2E8F0] rounded-lg p-4 text-center bg-[#F8FAFC] hover:bg-[#F0FDF4]/50 transition-colors">
          <FileSpreadsheet className="w-8 h-8 text-[#006B45] mx-auto mb-2 opacity-70" />
          <p className="text-xs text-[#0F172A] font-medium">Select a .csv or .tsv file from your computer</p>
          <label className="mt-2.5 inline-block px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#F0FDF4] cursor-pointer shadow-2xs">
            Browse File
            <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Paste Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#0F172A]">
            Or Paste Tabular CSV / TSV Text
          </label>
          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste CSV lines here (e.g. THEORY TEST, 293.5, 293.5, 292.45...)"
            className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-mono text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45]"
          />
          <div className="flex justify-end">
            <button
              onClick={handleImportTextSubmit}
              disabled={!importText.trim()}
              className="px-4 py-2 bg-[#006B45] hover:bg-[#064E3B] text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-40 shadow-xs"
            >
              Parse and Apply Prices
            </button>
          </div>
        </div>

        {/* Import Feedback */}
        {importSuccess && (
          <div className="p-3 bg-[#F0FDF4] text-[#064E3B] border border-[#D1FAE5] rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#006B45] shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Parsing Warnings:
            </div>
            <ul className="list-disc list-inside ml-2 space-y-0.5 text-[11px]">
              {importErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importErrors.length > 5 && <li>...and {importErrors.length - 5} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
