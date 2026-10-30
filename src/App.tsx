import React, { useState, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchDashboard } from './components/SearchDashboard';
import { SearchByFilter } from './components/SearchByFilter';
import { PriceMatrixView } from './components/PriceMatrixView';
import { TransportationPage } from './components/TransportationPage';
import { BranchLocationPage } from './components/BranchLocationPage';
import {
  RawMatrixRow,
  NormalizedPriceRecord,
  DataSourceState,
} from './types/pricing';
import { loadSavedMatrix } from './services/sheetsService';
import { normalizeMatrix } from './data/defaultPriceData';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Load initial matrix & metadata
  const initialData = useMemo(() => loadSavedMatrix(), []);
  const [matrix] = useState<RawMatrixRow[]>(initialData.matrix);

  // Compute normalized records whenever matrix changes
  const records = useMemo(() => normalizeMatrix(matrix), [matrix]);

  // Selected record for quick price card
  const [selectedRecord, setSelectedRecord] = useState<NormalizedPriceRecord | null>(() => {
    return records.find((r) => r.serviceName === 'THEORY TEST' && r.category === 'LMV' && r.feeType === 'REGULAR') || records[0] || null;
  });

  // Navigation tab state (search | filter | transport | matrix | branches)
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

  // Dynamic header titles based on active tab
  const tabDetails = useMemo(() => {
    switch (activeTab) {
      case 'filter':
        return {
          title: 'Search by Filter',
          description: 'Multi-criteria tariff lookup combining Category, Fee Type, specific Service, and AED Price Range.',
        };
      case 'transport':
        return {
          title: 'Transportation Schedule',
          description: 'Official bus routes, student pickup points, GPS map pins, and timetables for Al Quoz and DIC centres.',
        };
      case 'branches':
        return {
          title: 'Branch and Location',
          description: 'Official Eco Drive branch network across Dubai, traffic zone conditions, road training restrictions, and live availability.',
        };
      case 'matrix':
        return {
          title: 'Sheet Matrix View',
          description: 'Interactive 2D spreadsheet layout matching the original Google Sheet table format.',
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
        />

        {/* Hero Banner Strip (Royal Green & Dark Forest with Official Eco Drive Logo) */}
        <div className="bg-[#064E3B] text-white border-b border-[#004d32]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-black/20 border border-white/10 shrink-0">
                  <img
                    src="/assets/eco-drive-logo-white.png"
                    alt="Eco Drive Driving institute"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://www.ecodrivedubai.com/wp-content/uploads/2026/01/eco-drive-logo_White-01-768x313.png";
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold tracking-wider">
                    <span>Eco Drive Driving institute</span>
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

          {activeTab === 'transport' && (
            <TransportationPage />
          )}

          {activeTab === 'branches' && (
            <BranchLocationPage />
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
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E2E8F0] py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
            <span className="font-medium text-[#0F172A]">Eco Drive · Eco Drive Driving institute Tariff Search</span>
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
