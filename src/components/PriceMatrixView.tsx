import React, { useState } from 'react';
import { Search, Download, Check, Info } from 'lucide-react';
import { RawMatrixRow, NormalizedPriceRecord } from '../types/pricing';
import { SHEET_COLUMNS } from '../data/defaultPriceData';
import { formatAED, exportMatrixToCsv } from '../services/sheetsService';

interface PriceMatrixViewProps {
  matrix: RawMatrixRow[];
  onSelectCellRecord: (record: NormalizedPriceRecord) => void;
}

export const PriceMatrixView: React.FC<PriceMatrixViewProps> = ({
  matrix,
  onSelectCellRecord,
}) => {
  const [filterText, setFilterText] = useState('');
  const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null);

  const filteredMatrix = matrix.filter((row) =>
    row.serviceName.toLowerCase().includes(filterText.trim().toLowerCase())
  );

  const handleCellClick = (row: RawMatrixRow, colKey: string) => {
    const col = SHEET_COLUMNS.find((c) => c.key === colKey);
    if (!col) return;

    const price = row.prices[colKey] !== undefined ? row.prices[colKey] : null;
    const record: NormalizedPriceRecord = {
      id: `${row.serviceName}_${col.category}_${col.feeType}`,
      serviceName: row.serviceName,
      category: col.category,
      feeType: col.feeType,
      price,
    };

    onSelectCellRecord(record);

    if (price !== null) {
      navigator.clipboard.writeText(formatAED(price));
      setCopiedCellKey(`${row.serviceName}_${colKey}`);
      setTimeout(() => setCopiedCellKey(null), 1500);
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = exportMatrixToCsv(matrix);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rta_driving_school_pricelist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar for Matrix */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#006B45] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter spreadsheet rows..."
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#006B45]"
            />
          </div>
          <span className="text-xs text-[#64748B] whitespace-nowrap hidden sm:inline">
            Showing {filteredMatrix.length} of {matrix.length} services
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#064E3B] bg-[#F0FDF4] border border-[#D1FAE5] hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#006B45]" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Notice (Light Mint Theme) */}
      <div className="bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl p-3.5 text-xs text-[#064E3B] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#006B45] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>2D Source Spreadsheet View:</strong> This view matches the full Google Sheet matrix. Click any cell to copy its exact AED rate. Blank cells indicate fee types not offered for that vehicle class.
        </p>
      </div>

      {/* 2D Table Container */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20">
              {/* Category Group Header Row (Royal Green & Emerald Theme) */}
              <tr className="bg-[#064E3B] text-white font-bold text-center tracking-wider text-[11px] divide-x divide-white/10">
                <th className="py-2.5 px-4 text-left bg-[#053d2e] sticky left-0 z-30 min-w-[240px]">
                  SERVICE CATEGORY
                </th>
                <th colSpan={3} className="py-2 px-3 bg-[#006B45] text-white font-extrabold">
                  LMV FEE (Light Motor Vehicle)
                </th>
                <th colSpan={3} className="py-2 px-3 bg-[#059669] text-white font-extrabold">
                  MOT FEE (Motorcycle)
                </th>
                <th colSpan={2} className="py-2 px-3 bg-[#047857] text-white font-extrabold">
                  HVB FEE (Heavy Bus)
                </th>
                <th colSpan={2} className="py-2 px-3 bg-[#065F46] text-white font-extrabold">
                  HVT FEE (Heavy Truck)
                </th>
                <th colSpan={2} className="py-2 px-3 bg-[#0F766E] text-white font-extrabold">
                  HME FEE (Heavy Mechanical)
                </th>
              </tr>

              {/* Fee Type Subheader Row */}
              <tr className="bg-[#F8FAFC] text-[#064E3B] font-semibold text-center text-[10px] uppercase tracking-wider border-b border-[#E2E8F0] divide-x divide-[#E2E8F0]">
                <th className="py-2 px-4 text-left bg-[#F8FAFC] sticky left-0 z-30 text-[#64748B] font-bold">
                  Service Description
                </th>
                {/* LMV */}
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Regular</th>
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Flexi</th>
                <th className="py-2 px-2.5 min-w-[105px] bg-[#F0FDF4] text-[#064E3B]">Lumpsum (Absent)</th>
                {/* MOT */}
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Regular</th>
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Flexi</th>
                <th className="py-2 px-2.5 min-w-[105px] bg-[#F0FDF4] text-[#064E3B]">Lumpsum (Absent)</th>
                {/* HVB */}
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Regular</th>
                <th className="py-2 px-2.5 min-w-[105px] bg-[#F0FDF4] text-[#064E3B]">Lumpsum (Absent)</th>
                {/* HVT */}
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Regular</th>
                <th className="py-2 px-2.5 min-w-[105px] bg-[#F0FDF4] text-[#064E3B]">Lumpsum (Absent)</th>
                {/* HME */}
                <th className="py-2 px-2.5 min-w-[90px] bg-[#F0FDF4] text-[#064E3B]">Regular</th>
                <th className="py-2 px-2.5 min-w-[105px] bg-[#F0FDF4] text-[#064E3B]">Lumpsum (Absent)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredMatrix.map((row) => (
                <tr key={row.serviceName} className="hover:bg-[#F0FDF4]/60 transition-colors group">
                  {/* Pinned Service Name Column */}
                  <td className="py-2.5 px-4 font-semibold text-[#0F172A] bg-white group-hover:bg-[#F0FDF4]/40 sticky left-0 z-10 border-r border-[#E2E8F0]">
                    <span className="block leading-tight">{row.serviceName}</span>
                  </td>

                  {/* 12 Price Columns */}
                  {SHEET_COLUMNS.map((col) => {
                    const price = row.prices[col.key];
                    const hasPrice = price !== undefined && price !== null;
                    const isCopied = copiedCellKey === `${row.serviceName}_${col.key}`;

                    return (
                      <td
                        key={col.key}
                        onClick={() => handleCellClick(row, col.key)}
                        title={
                          hasPrice
                            ? `Click to copy AED ${price.toFixed(2)} (${col.headerLabel})`
                            : 'Not applicable for this license category'
                        }
                        className={`py-2 px-2.5 text-right font-mono tabular-nums border-r border-[#E2E8F0] transition-colors select-none ${
                          hasPrice
                            ? 'cursor-pointer hover:bg-[#D1FAE5] text-[#0F172A] font-medium'
                            : 'bg-slate-50/50 text-slate-300 italic'
                        }`}
                      >
                        {hasPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <span>{price.toFixed(price % 1 === 0 ? 0 : 2)}</span>
                            {isCopied && <Check className="w-3 h-3 text-[#006B45] inline" />}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
