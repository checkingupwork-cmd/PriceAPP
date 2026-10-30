import React from 'react';
import { Search, SlidersHorizontal, Grid3X3, CheckCircle2, Bus, MapPin } from 'lucide-react';
import { DataSourceState } from '../types/pricing';

export type ActiveTab = 'search' | 'filter' | 'matrix' | 'transport' | 'branches';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dataSource: DataSourceState;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dataSource,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Official Logo in brand container on mobile/tablet */}
          <div className="flex items-center gap-3 shrink-0 lg:hidden">
            <a
              href="#search"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('search');
              }}
              className="flex items-center bg-[#064E3B] px-3 py-1.5 rounded-xl border border-emerald-400/20 shadow-2xs hover:opacity-95 transition-opacity"
              title="Eco Drive Driving institute"
            >
              <img
                src="/assets/eco-drive-logo-white.png"
                alt="Eco Drive Driving institute"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://www.ecodrivedubai.com/wp-content/uploads/2026/01/eco-drive-logo_White-01-768x313.png";
                }}
              />
            </a>
          </div>

          {/* Breadcrumb / Title on Desktop */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-semibold text-[#0F172A]">Eco Drive</span>
            <span>/</span>
            <span className="text-[#006B45] font-semibold">
              {activeTab === 'search' && 'Price Search'}
              {activeTab === 'filter' && 'Search by Filter'}
              {activeTab === 'transport' && 'Transportation'}
              {activeTab === 'branches' && 'Branch and Location'}
              {activeTab === 'matrix' && 'Sheet Matrix'}
            </span>
          </div>

          {/* Zone 2: Navigation links on tablet / medium screens */}
          <nav className="hidden sm:flex lg:hidden items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs font-semibold ${
                activeTab === 'search'
                  ? 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Price Search</span>
            </button>

            <button
              onClick={() => setActiveTab('filter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs font-semibold ${
                activeTab === 'filter'
                  ? 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            <button
              onClick={() => setActiveTab('transport')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs font-semibold ${
                activeTab === 'transport'
                  ? 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Transportation</span>
            </button>

            <button
              onClick={() => setActiveTab('branches')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs font-semibold ${
                activeTab === 'branches'
                  ? 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Branches</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs font-semibold ${
                activeTab === 'matrix'
                  ? 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
          </nav>

          {/* Zone 3: Live Verified Source Badge */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#D1FAE5] text-[#064E3B] px-3 py-1.5 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="hidden sm:inline">Eco Drive Official Rates ·</span>
              <span className="font-semibold">{dataSource.availablePricesCount} Active Tariffs</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="sm:hidden flex items-center justify-around py-2 border-t border-[#E2E8F0] text-xs font-medium text-[#64748B]">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg ${
              activeTab === 'search' ? 'text-[#006B45] font-bold bg-[#F0FDF4]' : ''
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px]">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('filter')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg ${
              activeTab === 'filter' ? 'text-[#006B45] font-bold bg-[#F0FDF4]' : ''
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px]">Filter</span>
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg ${
              activeTab === 'transport' ? 'text-[#006B45] font-bold bg-[#F0FDF4]' : ''
            }`}
          >
            <Bus className="w-4 h-4" />
            <span className="text-[10px]">Bus</span>
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg ${
              activeTab === 'branches' ? 'text-[#006B45] font-bold bg-[#F0FDF4]' : ''
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px]">Branches</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg ${
              activeTab === 'matrix' ? 'text-[#006B45] font-bold bg-[#F0FDF4]' : ''
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="text-[10px]">Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
