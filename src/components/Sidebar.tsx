import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bus,
} from 'lucide-react';
import { ActiveTab } from './Header';
import { DataSourceState } from '../types/pricing';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dataSource: DataSourceState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dataSource,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      id: 'search' as ActiveTab,
      label: 'Price Search',
      description: 'One-click instant search',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'filter' as ActiveTab,
      label: 'Search by Filter',
      description: 'Category & fee filters',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      id: 'transport' as ActiveTab,
      label: 'Transportation',
      description: 'Centre bus schedules & stops',
      icon: <Bus className="w-4 h-4" />,
      badge: 'New',
    },
    {
      id: 'matrix' as ActiveTab,
      label: 'Sheet Matrix',
      description: '2D spreadsheet grid',
      icon: <Grid3X3 className="w-4 h-4" />,
    },
    {
      id: 'sync' as ActiveTab,
      label: 'Sheets Sync',
      description: 'Import & CSV connector',
      icon: <RefreshCw className="w-4 h-4" />,
    },
  ];

  return (
    <aside
      className={`hidden lg:flex lg:flex-col bg-[#064E3B] text-white shrink-0 min-h-screen transition-all duration-300 relative border-r border-[#004d32] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header with Official Eco Drive Logo */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          {!isCollapsed ? (
            <div className="py-0.5">
              <img
                src="/assets/eco-drive-logo-white.png"
                alt="Eco Drive Driving institute"
                className="h-9 w-auto max-w-[175px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://www.ecodrivedubai.com/wp-content/uploads/2026/01/eco-drive-logo_White-01-768x313.png";
                }}
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-[#006B45] text-white flex items-center justify-center shadow-xs shrink-0 border border-emerald-400/20 overflow-hidden p-1.5"
              title="Eco Drive Driving institute"
            >
              <img
                src="/assets/eco-drive-logo-white.png"
                alt="Eco Drive"
                className="h-full w-auto max-w-none object-left object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://www.ecodrivedubai.com/wp-content/uploads/2026/01/eco-drive-logo_White-01-768x313.png";
                }}
              />
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-200 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="p-3 flex-1 space-y-1.5">
        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
            Navigation
          </div>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative ${
                isActive
                  ? 'bg-[#006B45] text-white font-semibold shadow-xs border border-emerald-400/30'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/5 font-medium'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
              )}

              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isActive ? 'bg-white/10 text-emerald-200' : 'text-emerald-300/80'
                }`}
              >
                {item.icon}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm truncate">{item.label}</span>
                    {item.badge && !isActive && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`block text-[10px] truncate ${
                      isActive ? 'text-emerald-100/80' : 'text-emerald-300/50'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Source Status Box */}
      <div className="p-3 border-t border-white/10">
        {!isCollapsed ? (
          <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Eco Drive Official Rates</span>
            </div>
            <p className="text-[11px] text-emerald-100/60 leading-snug">
              {dataSource.totalServicesCount} Services · 5 License Categories
            </p>
            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-200/50">
              <span>Currency: AED</span>
              <span className="text-emerald-300 font-semibold">Dubai</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Eco Drive Official Rates Verified">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
