import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Search,
  Download,
  Copy,
  Check,
  ArrowUpDown,
  Filter,
  Share2,
  ChevronDown,
} from 'lucide-react';
import { NormalizedPriceRecord, CategoryCode, FeeType, RawMatrixRow } from '../types/pricing';
import { CATEGORIES } from '../data/defaultPriceData';
import { formatAED } from '../services/sheetsService';

interface SearchByFilterProps {
  records: NormalizedPriceRecord[];
  matrix: RawMatrixRow[];
}

type SortColumn = 'service' | 'category' | 'feeType' | 'price';
type SortDirection = 'asc' | 'desc';

export const SearchByFilter: React.FC<SearchByFilterProps> = ({
  records,
  matrix,
}) => {
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | 'ALL'>('ALL');
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | 'ALL'>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Applied Filters State
  const [appliedCategory, setAppliedCategory] = useState<CategoryCode | 'ALL'>('ALL');
  const [appliedFeeType, setAppliedFeeType] = useState<FeeType | 'ALL'>('ALL');
  const [appliedService, setAppliedService] = useState<string>('ALL');
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>('');

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('service');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Copy Feedback States
  const [copiedPriceId, setCopiedPriceId] = useState<string | null>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close service dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distinct list of all service names directly from source matrix
  const allServiceNames = useMemo(() => {
    const names = matrix.map((row) => row.serviceName);
    return Array.from(new Set(names));
  }, [matrix]);

  // Filtered service list for searchable dropdown
  const filteredServiceNames = useMemo(() => {
    if (!serviceSearchTerm.trim()) return allServiceNames;
    const term = serviceSearchTerm.toLowerCase();
    return allServiceNames.filter((name) => name.toLowerCase().includes(term));
  }, [allServiceNames, serviceSearchTerm]);

  // Dynamic fee types based on selected Category
  const availableFeeTypes = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return ['ALL', 'REGULAR', 'FLEXI', 'LUMPSUM (Absent)'] as (FeeType | 'ALL')[];
    }
    const cat = CATEGORIES.find((c) => c.code === selectedCategory);
    const applicable = cat ? cat.applicableFeeTypes : ['REGULAR', 'LUMPSUM (Absent)'];
    return ['ALL', ...applicable] as (FeeType | 'ALL')[];
  }, [selectedCategory]);

  // If selectedFeeType is not valid for category, reset to ALL
  useEffect(() => {
    if (selectedFeeType !== 'ALL' && !availableFeeTypes.includes(selectedFeeType)) {
      setSelectedFeeType('ALL');
    }
  }, [selectedCategory, availableFeeTypes, selectedFeeType]);

  // Apply filters on click
  const handleApplyFilters = () => {
    setAppliedCategory(selectedCategory);
    setAppliedFeeType(selectedFeeType);
    setAppliedService(selectedService);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedFeeType('ALL');
    setSelectedService('ALL');
    setServiceSearchTerm('');
    setMinPrice('');
    setMaxPrice('');

    setAppliedCategory('ALL');
    setAppliedFeeType('ALL');
    setAppliedService('ALL');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');

    setSortColumn('service');
    setSortDirection('asc');
  };

  // Filtered and Sorted Results with AND Logic
  const filteredResults = useMemo(() => {
    const min = appliedMinPrice !== '' ? parseFloat(appliedMinPrice) : null;
    const max = appliedMaxPrice !== '' ? parseFloat(appliedMaxPrice) : null;

    return records
      .filter((record) => {
        // Filter 1: Category (AND)
        if (appliedCategory !== 'ALL' && record.category !== appliedCategory) {
          return false;
        }

        // Filter 2: Fee Type (AND)
        if (appliedFeeType !== 'ALL' && record.feeType !== appliedFeeType) {
          return false;
        }

        // Filter 3: Service Name (AND)
        if (appliedService !== 'ALL' && record.serviceName !== appliedService) {
          return false;
        }

        // Filter 4: Price Range (AND)
        if (min !== null || max !== null) {
          if (record.price === null) {
            return false;
          }
          if (min !== null && !isNaN(min) && record.price < min) {
            return false;
          }
          if (max !== null && !isNaN(max) && record.price > max) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortColumn === 'service') {
          cmp = a.serviceName.localeCompare(b.serviceName);
        } else if (sortColumn === 'category') {
          cmp = a.category.localeCompare(b.category);
        } else if (sortColumn === 'feeType') {
          cmp = a.feeType.localeCompare(b.feeType);
        } else if (sortColumn === 'price') {
          const priceA = a.price === null ? -Infinity : a.price;
          const priceB = b.price === null ? -Infinity : b.price;
          cmp = priceA - priceB;
        }

        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [
    records,
    appliedCategory,
    appliedFeeType,
    appliedService,
    appliedMinPrice,
    appliedMaxPrice,
    sortColumn,
    sortDirection,
  ]);

  // Handle Sort Click
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Copy single price
  const handleCopyPrice = async (e: React.MouseEvent, record: NormalizedPriceRecord) => {
    e.stopPropagation();
    if (record.price === null) return;
    await navigator.clipboard.writeText(formatAED(record.price));
    setCopiedPriceId(record.id);
    setTimeout(() => setCopiedPriceId(null), 1800);
  };

  // Copy complete summary
  const handleCopySummary = async (e: React.MouseEvent, record: NormalizedPriceRecord) => {
    e.stopPropagation();
    const priceText = record.price !== null ? formatAED(record.price) : 'Not Available';
    const summary = `Service: ${record.serviceName} | Category: ${record.category} | Fee Type: ${record.feeType} | Price: ${priceText}`;
    await navigator.clipboard.writeText(summary);
    setCopiedSummaryId(record.id);
    setTimeout(() => setCopiedSummaryId(null), 1800);
  };

  // Export Filtered Results to CSV
  const handleExportFilteredCsv = () => {
    if (filteredResults.length === 0) return;

    const headers = ['Service Name', 'Category', 'Fee Type', 'Price (AED)'];
    const rows = filteredResults.map((r) => [
      `"${r.serviceName.replace(/"/g, '""')}"`,
      r.category,
      `"${r.feeType}"`,
      r.price !== null ? r.price.toFixed(2) : 'Not Available',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `filtered_driving_school_prices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    appliedCategory !== 'ALL' ||
    appliedFeeType !== 'ALL' ||
    appliedService !== 'ALL' ||
    appliedMinPrice !== '' ||
    appliedMaxPrice !== '';

  return (
    <div className="space-y-6">
      {/* 1. Page Header Description & Top Action */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Search by Filter</h2>
              <p className="text-xs text-[#64748B]">
                Combine License Category, Fee Type, specific Service, and AED Price Range to isolate exact tariffs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFilteredCsv}
              disabled={filteredResults.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#064E3B] bg-[#F0FDF4] border border-[#D1FAE5] hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40"
              title="Download currently filtered rows as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#006B45]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Top Filter Controls Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[#E2E8F0] text-xs">
          {/* Filter 1: Category */}
          <div>
            <label className="block text-[#0F172A] font-semibold mb-1.5">
              1. Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value as CategoryCode | 'ALL';
                setSelectedCategory(val);
                setAppliedCategory(val);
              }}
              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] cursor-pointer"
            >
              <option value="ALL">All Categories (LMV, MOT, HVB, HVT, HME)</option>
              <option value="LMV">LMV - Light Motor Vehicle</option>
              <option value="MOT">MOT - Motorcycle</option>
              <option value="HVB">HVB - Heavy Bus</option>
              <option value="HVT">HVT - Heavy Truck</option>
              <option value="HME">HME - Heavy Mechanical Equipment</option>
            </select>
          </div>

          {/* Filter 2: Fee Type */}
          <div>
            <label className="block text-[#0F172A] font-semibold mb-1.5">
              2. Fee Type
            </label>
            <select
              value={selectedFeeType}
              onChange={(e) => {
                const val = e.target.value as FeeType | 'ALL';
                setSelectedFeeType(val);
                setAppliedFeeType(val);
              }}
              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] cursor-pointer"
            >
              <option value="ALL">All Fee Types</option>
              <option value="REGULAR">Regular</option>
              {availableFeeTypes.includes('FLEXI') && (
                <option value="FLEXI">Flexi</option>
              )}
              <option value="LUMPSUM (Absent)">Lumpsum (Absent)</option>
            </select>
          </div>

          {/* Filter 3: Service Name Searchable Combobox */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[#0F172A] font-semibold mb-1.5">
              3. Service Name
            </label>
            <div
              onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-medium flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-[#006B45] focus-within:border-[#006B45]"
            >
              <span className="truncate pr-2">
                {selectedService === 'ALL' ? 'All Services (21 Services)' : selectedService}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Dropdown Menu */}
            {isServiceDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 p-2 space-y-1.5 max-h-72 flex flex-col">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    placeholder="Type part of service name..."
                    className="w-full pl-8 pr-2 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#006B45]"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto max-h-48 divide-y divide-slate-100">
                  <button
                    onClick={() => {
                      setSelectedService('ALL');
                      setAppliedService('ALL');
                      setIsServiceDropdownOpen(false);
                      setServiceSearchTerm('');
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                      selectedService === 'ALL'
                        ? 'bg-[#F0FDF4] text-[#006B45] font-bold'
                        : 'text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <span>All Services</span>
                    {selectedService === 'ALL' && <Check className="w-3.5 h-3.5 text-[#006B45]" />}
                  </button>

                  {filteredServiceNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedService(name);
                        setAppliedService(name);
                        setIsServiceDropdownOpen(false);
                        setServiceSearchTerm('');
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                        selectedService === name
                          ? 'bg-[#F0FDF4] text-[#006B45] font-bold'
                          : 'text-[#0F172A] hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-2">{name}</span>
                      {selectedService === name && <Check className="w-3.5 h-3.5 text-[#006B45] shrink-0" />}
                    </button>
                  ))}

                  {filteredServiceNames.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#64748B] italic">
                      No matching service name
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filter 4: Price Range (Min & Max AED) */}
          <div>
            <label className="block text-[#0F172A] font-semibold mb-1.5">
              4. Price Range (AED, Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min AED"
                className="w-1/2 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45]"
              />
              <span className="text-[#64748B] text-xs font-medium">—</span>
              <input
                type="number"
                min="0"
                step="any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max AED"
                className="w-1/2 px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45]"
              />
            </div>
          </div>
        </div>

        {/* 3. Action Buttons: Search Prices + Reset Filters */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors border border-[#E2E8F0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#006B45] hover:bg-[#064E3B] text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-emerald-200" />
            <span>Search Prices</span>
          </button>
        </div>
      </div>

      {/* 4. Results Header & Count */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-[#64748B] px-1">
        <div className="flex items-center gap-2">
          <span>
            Found <strong className="text-[#0F172A] font-bold text-base sm:text-lg tabular-nums">{filteredResults.length}</strong> matching price combination{filteredResults.length === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <span className="text-[11px] text-[#006B45] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#D1FAE5] font-semibold">
              Filtered
            </span>
          )}
        </div>

        <span className="text-xs text-[#059669] font-medium hidden sm:inline">
          Click column headers to sort results
        </span>
      </div>

      {/* 5. Results Table */}
      {filteredResults.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] text-[#006B45] flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-[#0F172A]">No results found</h4>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            No prices match your selected criteria. Try adjusting the category, fee type, or price range.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#006B45] text-white rounded-lg text-xs font-semibold hover:bg-[#064E3B] transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                  {/* Service Name Header */}
                  <th
                    onClick={() => handleSort('service')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Service Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#006B45]" />
                    </div>
                  </th>

                  {/* Category Header */}
                  <th
                    onClick={() => handleSort('category')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#006B45]" />
                    </div>
                  </th>

                  {/* Fee Type Header */}
                  <th
                    onClick={() => handleSort('feeType')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fee Type</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#006B45]" />
                    </div>
                  </th>

                  {/* Price (AED) Header */}
                  <th
                    onClick={() => handleSort('price')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Price (AED)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#006B45]" />
                    </div>
                  </th>

                  {/* Actions Header */}
                  <th className="py-3 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredResults.map((record) => {
                  const isAvailable = record.price !== null;
                  const isPriceCopied = copiedPriceId === record.id;
                  const isSummaryCopied = copiedSummaryId === record.id;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#F0FDF4]/50 transition-colors"
                    >
                      {/* Service Name */}
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {record.serviceName}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#006B45] bg-[#F0FDF4] border border-[#D1FAE5] px-2.5 py-0.5 rounded-md text-xs">
                          {record.category}
                        </span>
                      </td>

                      {/* Fee Type */}
                      <td className="py-3 px-3 text-[#64748B] text-xs">
                        {record.feeType}
                      </td>

                      {/* Price (AED) */}
                      <td className="py-3 px-4 text-right">
                        {isAvailable ? (
                          <span className="text-base font-bold text-[#0F172A] tabular-nums font-mono">
                            {formatAED(record.price)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            — Not Available
                          </span>
                        )}
                      </td>

                      {/* Quick Actions (Copy Price & Copy Summary) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Copy Price Button */}
                          <button
                            onClick={(e) => handleCopyPrice(e, record)}
                            disabled={!isAvailable}
                            title="Copy price (e.g. AED 293.50)"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isPriceCopied
                                ? 'bg-[#F0FDF4] text-[#006B45] border-[#D1FAE5]'
                                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F0FDF4] hover:text-[#006B45] hover:border-[#D1FAE5]'
                            } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {isPriceCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#006B45]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Copy Summary Button */}
                          <button
                            onClick={(e) => handleCopySummary(e, record)}
                            title="Copy full summary"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSummaryCopied
                                ? 'bg-[#F0FDF4] text-[#006B45] border-[#D1FAE5]'
                                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F0FDF4] hover:text-[#006B45] hover:border-[#D1FAE5]'
                            }`}
                          >
                            {isSummaryCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#006B45]" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
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
    </div>
  );
};
