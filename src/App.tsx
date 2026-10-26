import React, { useState, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchDashboard } from './components/SearchDashboard';
import { SearchByFilter } from './components/SearchByFilter';
import { PriceMatrixView } from './components/PriceMatrixView';
import { SheetsSyncModal } from './components/SheetsSyncModal';
import {
  RawMatrixRow,
  NormalizedPriceRecord,
  DataSourceState,
} from './types/pricing';
import {
  loadSavedMatrix,
  saveMatrixToStorage,
  resetToDefaultMatrix,
} from './services/sheetsService';
import { normalizeMatrix } from './data/defaultPriceData';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Load initial matrix & metadata
  const initialData = useMemo(() => loadSavedMatrix(), []);
  const [matrix, setMatrix] = useState<RawMatrixRow[]>(initialData.matrix);

  // Compute normalized records whenever matrix changes
  const records = useMemo(() => normalizeMatrix(matrix), [matrix]);

  // Selected record for quick price card
  const [selectedRecord, setSelectedRecord] = useState<NormalizedPriceRecord | null>(() => {
    return records.find((r) => r.serviceName === 'THEORY TEST' && r.category === 'LMV' && r.feeType === 'REGULAR') || records[0] || null;
  });

  // Navigation tab state (search | filter | matrix | sync)
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Data source metrics
  const dataSource: DataSourceState = useMemo(() => {
    const totalCombinations = records.length;
    const availablePrices = records.filter((r) => r.price !== null).length;
    return {
      type: initialData.meta.sourceType,
      sourceName: initialData.meta.sourceName,
      lastSyncTimestamp: initialData.meta.lastSyncTimestamp,
      googleSheetUrl: initialData.meta.googleSheetUrl,
      totalServicesCount: matrix.length,
      totalPricePointsCount: totalCombinations,
      availablePricesCount: availablePrices,
    };
  }, [matrix, records, initialData]);

  // Update Matrix from Google Sheet sync or CSV Import
  const handleUpdateMatrix = (
    newMatrix: RawMatrixRow[],
    sourceType: 'google_sheet_url' | 'imported_file' | 'default_sheet',
    sourceName: string,
    url?: string
  ) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMatrix(newMatrix);
    saveMatrixToStorage(newMatrix, {
      sourceType,
      sourceName,
      lastSyncTimestamp: timestamp,
      googleSheetUrl: url,
    });
    showToast(`Data refreshed: ${newMatrix.length} service rows loaded`);
  };

  // Reset to verified original source matrix
  const handleResetToDefault = () => {
    const restored = resetToDefaultMatrix();
    setMatrix(restored.matrix);
    showToast('Restored official verified price matrix');
  };

  // Dynamic header titles based on active tab
  const tabDetails = useMemo(() => {
    switch (activeTab) {
      case 'filter':
        return {
          title: 'Search by Filter',
          description: 'Multi-criteria tariff lookup combining Category, Fee Type, specific Service, and AED Price Range.',
        };
      case 'matrix':
        return {
          title: 'Sheet Matrix View',
          description: 'Interactive 2D spreadsheet layout matching the original Google Sheet table format.',
        };
      case 'sync':
        return {
          title: 'Google Sheets Sync & Data Import',
          description: 'Connect live Google Sheets URLs or upload exported CSV files with automatic validation.',
        };
      case 'search':
      default:
        return {
          title: 'Price Search Dashboard',
          description: 'Ultra-fast search for driving school service prices across LMV, MOT, HVB, HVT, and HME.',
        };
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* 1. Desktop Royal Green Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataSource={dataSource}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dataSource={dataSource}
          onOpenSync={() => setActiveTab('sync')}
        />

        {/* Hero Banner Strip (Royal Green & Dark Forest) */}
        <div className="bg-[#064E3B] text-white border-b border-[#004d32]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  <span>RTA Licensed Driving School</span>
                  <span>·</span>
                  <span>Dubai, UAE</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                  {tabDetails.title}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                  {tabDetails.description}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-[#004d32]/80 backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs text-emerald-100 flex items-center gap-2 border border-emerald-500/20 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block font-semibold text-white">Source of Truth Active</span>
                    <span className="text-[11px] text-emerald-200/70">
                      {dataSource.availablePricesCount} Verified Rates · Decimals Preserved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
          {activeTab === 'search' && (
            <SearchDashboard
              records={records}
              matrix={matrix}
              selectedRecord={selectedRecord}
              setSelectedRecord={setSelectedRecord}
            />
          )}

          {activeTab === 'filter' && (
            <SearchByFilter
              records={records}
              matrix={matrix}
            />
          )}

          {activeTab === 'matrix' && (
            <PriceMatrixView
              matrix={matrix}
              onSelectCellRecord={(record) => {
                setSelectedRecord(record);
                if (record.price !== null) {
                  showToast(`Copied ${record.serviceName} (${record.category}): AED ${record.price.toFixed(2)}`);
                }
              }}
            />
          )}

          {activeTab === 'sync' && (
            <SheetsSyncModal
              matrix={matrix}
              dataSource={dataSource}
              onUpdateMatrix={handleUpdateMatrix}
              onResetToDefault={handleResetToDefault}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E2E8F0] py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
            <span className="font-medium text-[#0F172A]">DrivePrice · Driving School Tariff & RTA Test Price Search</span>
            <div className="flex items-center gap-4">
              <span>21 Verified Services</span>
              <span>·</span>
              <span>All Currency in AED</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#064E3B] text-white px-4 py-3 rounded-xl shadow-lg border border-[#006B45] text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
