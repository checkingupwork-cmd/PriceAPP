import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  RotateCcw,
  Copy,
  Check,
  Car,
  Bike,
  Bus,
  Truck,
  Wrench,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { NormalizedPriceRecord, CategoryCode, FeeType, RawMatrixRow } from '../types/pricing';
import { CATEGORIES } from '../data/defaultPriceData';
import { formatAED } from '../services/sheetsService';

interface SearchDashboardProps {
  records: NormalizedPriceRecord[];
  matrix: RawMatrixRow[];
  selectedRecord: NormalizedPriceRecord | null;
  setSelectedRecord: (record: NormalizedPriceRecord | null) => void;
}

// 9 Most Important Services
const FREQUENT_SERVICES = [
  { label: 'Theory Test', matchQuery: 'THEORY TEST' },
  { label: 'Initial Assessment Test', matchQuery: 'INITIAL ASSESSMENT' },
  { label: 'RTA Yard Test', matchQuery: 'RTA YARD TEST' },
  { label: 'RTA Road Test', matchQuery: 'RTA ROAD TEST' },
  { label: 'Learning Permit', matchQuery: 'Learning Permit' },
  { label: 'RTA File Renewal', matchQuery: 'RTA FILE RENEWAL' },
  { label: 'RTA Prepone Test Fee', matchQuery: 'RTA PREPONE' },
  { label: 'Gear Change', matchQuery: 'GEAR CHANGE' },
  { label: 'Eye Test', matchQuery: 'EYE TEST' },
];

interface ServiceCategoryGroup {
  serviceName: string;
  category: CategoryCode;
  prices: {
    feeType: FeeType;
    price: number | null;
    recordId: string;
    rawRecord: NormalizedPriceRecord;
  }[];
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  records,
  matrix,
  selectedRecord,
  setSelectedRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | 'ALL'>('ALL');
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | 'ALL'>('ALL');
  const [activeFrequentService, setActiveFrequentService] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedGroupKey, setCopiedGroupKey] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount and handle keyboard shortcut '/' and 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute available fee types based on selected Category
  const availableFeeTypesForCategory = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return ['ALL FEES', 'REGULAR', 'FLEXI', 'LUMPSUM (Absent)'];
    }
    const cat = CATEGORIES.find((c) => c.code === selectedCategory);
    const feeTypes = cat ? cat.applicableFeeTypes : ['REGULAR', 'LUMPSUM (Absent)'];
    return ['ALL FEES', ...feeTypes];
  }, [selectedCategory]);

  // If user selected Flexi, but then clicks HVB/HVT/HME, reset fee type to ALL
  useEffect(() => {
    if (selectedFeeType !== 'ALL' && !availableFeeTypesForCategory.includes(selectedFeeType)) {
      setSelectedFeeType('ALL');
    }
  }, [selectedCategory, availableFeeTypesForCategory, selectedFeeType]);

  // Handle single Reset button
  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedFeeType('ALL');
    setActiveFrequentService(null);
    searchInputRef.current?.focus();
  };

  // Handle quick click on Frequent Services
  const handleFrequentServiceClick = (service: typeof FREQUENT_SERVICES[0]) => {
    if (activeFrequentService === service.label) {
      setActiveFrequentService(null);
      setSearchQuery('');
    } else {
      setActiveFrequentService(service.label);
      setSearchQuery(service.matchQuery);
    }
  };

  // Group matrix data by Service Name and Category
  const groupedServiceCards = useMemo(() => {
    const groups: ServiceCategoryGroup[] = [];
    const query = searchQuery.trim().toLowerCase();

    matrix.forEach((row, rowIndex) => {
      CATEGORIES.forEach((cat) => {
        if (selectedCategory !== 'ALL' && selectedCategory !== cat.code) {
          return;
        }

        const catPrices = cat.applicableFeeTypes.map((feeType) => {
          const colKey = `${cat.code}_${feeType.includes('LUMPSUM') ? 'LUMPSUM' : feeType}`;
          const priceVal = row.prices[colKey] !== undefined ? row.prices[colKey] : null;
          const recordId = `${rowIndex}_${cat.code}_${feeType}`;
          const rawRecord: NormalizedPriceRecord = {
            id: recordId,
            serviceName: row.serviceName,
            category: cat.code,
            feeType: feeType as FeeType,
            price: priceVal,
          };
          return {
            feeType: feeType as FeeType,
            price: priceVal,
            recordId,
            rawRecord,
          };
        });

        const filteredPrices = selectedFeeType === 'ALL'
          ? catPrices
          : catPrices.filter((p) => p.feeType === selectedFeeType);

        if (filteredPrices.length > 0) {
          groups.push({
            serviceName: row.serviceName,
            category: cat.code,
            prices: filteredPrices,
          });
        }
      });
    });

    return groups
      .filter((group) => {
        if (!query) return true;

        const sName = group.serviceName.toLowerCase();
        const catCode = group.category.toLowerCase();
        const catInfo = CATEGORIES.find((c) => c.code === group.category);
        const catFull = catInfo ? catInfo.fullName.toLowerCase() : '';

        const matchesService = sName.includes(query);
        const matchesCategory = catCode.includes(query) || catFull.includes(query);

        let matchesSynonym = false;
        if (query === 'theory' && sName.includes('theory')) matchesSynonym = true;
        if (query === 'road' && (sName.includes('road') || sName.includes('refresher'))) matchesSynonym = true;
        if (query === 'yard' && sName.includes('yard')) matchesSynonym = true;
        if (query === 'permit' && sName.includes('permit')) matchesSynonym = true;
        if (query === 'renewal' && sName.includes('renewal')) matchesSynonym = true;
        if (query === 'prepone' && sName.includes('prepone')) matchesSynonym = true;
        if (query === 'gear' && sName.includes('gear')) matchesSynonym = true;
        if (query === 'eye' && sName.includes('eye')) matchesSynonym = true;
        if (query === 'class' && (sName.includes('class') || sName.includes('hour'))) matchesSynonym = true;
        if (query === 'assessment' && sName.includes('assess')) matchesSynonym = true;
        if (query === 'gcc' && sName.includes('gcc')) matchesSynonym = true;
        if (query === 'translation' && sName.includes('translation')) matchesSynonym = true;

        return matchesService || matchesCategory || matchesSynonym;
      })
      .sort((a, b) => {
        const sA = a.serviceName.toLowerCase();
        const sB = b.serviceName.toLowerCase();

        if (query) {
          const aStarts = sA.startsWith(query);
          const bStarts = sB.startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          const aIndex = sA.indexOf(query);
          const bIndex = sB.indexOf(query);
          if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
            return aIndex - bIndex;
          }
        } else {
          const isFreqA = FREQUENT_SERVICES.some((f) => sA.includes(f.matchQuery.toLowerCase()));
          const isFreqB = FREQUENT_SERVICES.some((f) => sB.includes(f.matchQuery.toLowerCase()));
          if (isFreqA && !isFreqB) return -1;
          if (!isFreqA && isFreqB) return 1;
        }

        const catOrder: Record<string, number> = { LMV: 1, MOT: 2, HVB: 3, HVT: 4, HME: 5 };
        const catDiff = (catOrder[a.category] || 99) - (catOrder[b.category] || 99);
        if (catDiff !== 0) return catDiff;

        return a.serviceName.localeCompare(b.serviceName);
      });
  }, [matrix, searchQuery, selectedCategory, selectedFeeType]);

  // Copy single price
  const handleCopyPrice = async (e: React.MouseEvent, price: number | null, key: string) => {
    e.stopPropagation();
    if (price === null) return;
    await navigator.clipboard.writeText(formatAED(price));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Copy all prices for a card
  const handleCopyAllPrices = async (e: React.MouseEvent, group: ServiceCategoryGroup) => {
    e.stopPropagation();
    const catInfo = CATEGORIES.find((c) => c.code === group.category);
    const validLines = group.prices
      .map((p) => `${p.feeType}: ${p.price !== null ? formatAED(p.price) : 'Not Available'}`)
      .join('\n');

    const summary = `${group.serviceName} (${group.category} - ${catInfo?.fullName || ''})\n${validLines}\n*Driving School RTA Tariffs (Dubai/UAE)`;

    await navigator.clipboard.writeText(summary);
    setCopiedGroupKey(`${group.serviceName}_${group.category}`);
    setTimeout(() => setCopiedGroupKey(null), 2000);
  };

  // Category Icon helper
  const getCategoryIcon = (code: CategoryCode) => {
    switch (code) {
      case 'LMV':
        return <Car className="w-5 h-5 text-[#006B45]" />;
      case 'MOT':
        return <Bike className="w-5 h-5 text-[#059669]" />;
      case 'HVB':
        return <Bus className="w-5 h-5 text-[#064E3B]" />;
      case 'HVT':
        return <Truck className="w-5 h-5 text-[#006B45]" />;
      case 'HME':
        return <Wrench className="w-5 h-5 text-[#059669]" />;
      default:
        return <Car className="w-5 h-5 text-[#006B45]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. LARGE PROMINENT SEARCH BAR (Royal Green Themed) */}
      <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] focus-within:border-[#006B45] focus-within:ring-4 focus-within:ring-[#006B45]/10 shadow-xs transition-all overflow-hidden">
        <div className="relative flex items-center">
          <div className="absolute left-4.5 sm:left-5 text-[#006B45] pointer-events-none">
            <Search className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveFrequentService(null);
            }}
            placeholder="🔍 Type a service name... e.g. Theory Test, RTA Road Test, Gear Change"
            className="w-full pl-14 sm:pl-16 pr-14 py-4 sm:py-5 text-base sm:text-lg font-medium text-[#0F172A] placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFrequentService(null);
                searchInputRef.current?.focus();
              }}
              title="Clear search"
              className="absolute right-4 p-2 rounded-full text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. FIVE LARGE CATEGORY BUTTONS + ALL BUTTON */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
          {/* ALL Button */}
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`py-3 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
              selectedCategory === 'ALL'
                ? 'bg-[#006B45] text-white border-[#006B45] shadow-sm ring-2 ring-[#006B45]/20 font-bold'
                : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#006B45]/40 hover:bg-[#F0FDF4]'
            }`}
          >
            <span className="text-base sm:text-lg font-bold tracking-tight">ALL</span>
            <span className={`text-[11px] font-medium mt-0.5 ${selectedCategory === 'ALL' ? 'text-emerald-200' : 'text-[#64748B]'}`}>
              All Categories
            </span>
          </button>

          {/* LMV, MOT, HVB, HVT, HME Buttons */}
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.code;
            return (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[#006B45] text-white border-[#006B45] shadow-sm ring-2 ring-[#006B45]/20 font-bold'
                    : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#006B45]/40 hover:bg-[#F0FDF4]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-base sm:text-lg font-bold tracking-tight ${isSelected ? 'text-white' : 'text-[#0F172A]'}`}>
                    {cat.code}
                  </span>
                </div>
                <span className={`text-[11px] font-medium mt-0.5 truncate max-w-full ${isSelected ? 'text-emerald-100' : 'text-[#64748B]'}`}>
                  {cat.fullName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. QUICK FEE-TYPE BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] shrink-0">
            Fee Type:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableFeeTypesForCategory.map((type) => {
              const isSelected =
                (type === 'ALL FEES' && selectedFeeType === 'ALL') ||
                selectedFeeType === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedFeeType(type === 'ALL FEES' ? 'ALL' : (type as FeeType))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#006B45] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0FDF4] border border-[#E2E8F0]'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Single Reset Button */}
        {(searchQuery || selectedCategory !== 'ALL' || selectedFeeType !== 'ALL' || activeFrequentService) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 4. MOST IMPORTANT SERVICES (Quick-Access Buttons) */}
      <div className="bg-[#F0FDF4] rounded-xl p-3.5 border border-[#D1FAE5]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#064E3B] flex items-center gap-1.5">
            ⚡ Quick-Access Services
          </span>
          <span className="text-[11px] text-[#059669] hidden sm:inline font-medium">
            Click any button to view tariffs immediately
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FREQUENT_SERVICES.map((item) => {
            const isActive = activeFrequentService === item.label;
            return (
              <button
                key={item.label}
                onClick={() => handleFrequentServiceClick(item)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isActive
                    ? 'bg-[#006B45] text-white border-[#006B45] shadow-xs font-semibold'
                    : 'bg-white text-[#0F172A] border-[#D1FAE5] hover:border-[#006B45] hover:bg-emerald-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. RESULTS HEADER */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-[#64748B] px-1 pt-1">
        <div>
          <strong className="text-[#0F172A] font-bold text-base sm:text-lg tabular-nums">
            {groupedServiceCards.length}
          </strong>{' '}
          service{groupedServiceCards.length === 1 ? '' : 's'} found
          {selectedCategory !== 'ALL' && (
            <span className="text-[#64748B]"> in category <strong className="text-[#006B45]">{selectedCategory}</strong></span>
          )}
          {selectedFeeType !== 'ALL' && (
            <span className="text-[#64748B]"> ({selectedFeeType})</span>
          )}
        </div>

        <span className="text-xs text-[#059669] font-medium">
          Source: Verified RTA Tariff Data
        </span>
      </div>

      {/* 6. CLEAN RESULTS DISPLAY - ROYAL GREEN CARDS */}
      {groupedServiceCards.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-2xl p-10 text-center">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-[#0F172A]">No services found for "{searchQuery}"</h4>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Try checking the spelling, selecting "ALL" categories, or clicking one of the quick service buttons above.
          </p>
          <button
            onClick={handleReset}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#006B45] text-white rounded-lg text-xs font-semibold hover:bg-[#064E3B] transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show All Services</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedServiceCards.map((group) => {
            const groupKey = `${group.serviceName}_${group.category}`;
            const catInfo = CATEGORIES.find((c) => c.code === group.category);
            const isGroupCopied = copiedGroupKey === groupKey;
            const hasAnyAvailablePrice = group.prices.some((p) => p.price !== null);

            return (
              <div
                key={groupKey}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs hover:border-[#006B45]/40 hover:shadow-xs transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Service Name + Category Badge */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                        {group.serviceName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-[#64748B]">
                        <span className="font-semibold text-[#006B45]">{catInfo?.fullName}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md text-xs font-extrabold uppercase bg-[#006B45] text-white shrink-0 tracking-wide shadow-2xs">
                      {group.category}
                    </span>
                  </div>

                  {/* Fee Types & Prices List */}
                  <div className="divide-y divide-slate-100 py-2">
                    {group.prices.map((p) => {
                      const isAvailable = p.price !== null;
                      const copyId = `${groupKey}_${p.feeType}`;
                      const isCopied = copiedKey === copyId;

                      return (
                        <div
                          key={p.feeType}
                          className="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm"
                        >
                          <div className="text-[#64748B] font-medium flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#059669]" />
                            <span>{p.feeType}:</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAvailable ? (
                              <>
                                <span className="font-bold text-[#0F172A] font-mono tabular-nums text-base sm:text-lg">
                                  {formatAED(p.price)}
                                </span>
                                <button
                                  onClick={(e) => handleCopyPrice(e, p.price, copyId)}
                                  title="Copy price"
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isCopied
                                      ? 'bg-[#F0FDF4] text-[#006B45] border-[#D1FAE5]'
                                      : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F0FDF4] hover:text-[#006B45] hover:border-[#D1FAE5]'
                                  }`}
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-[#006B45]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Not Available
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer: Copy All Prices Button */}
                {hasAnyAvailablePrice && (
                  <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">
                      Official RTA Approved
                    </span>
                    <button
                      onClick={(e) => handleCopyAllPrices(e, group)}
                      className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all ${
                        isGroupCopied
                          ? 'bg-[#F0FDF4] text-[#006B45] border-[#D1FAE5]'
                          : 'bg-[#F8FAFC] text-[#064E3B] border-[#D1FAE5] hover:bg-[#F0FDF4]'
                      }`}
                    >
                      {isGroupCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#006B45]" />
                          <span>Copied All Prices!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-[#006B45]" />
                          <span>Copy All Prices</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
