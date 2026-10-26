import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bus,
  MapPin,
  Clock,
  Search,
  X,
  ExternalLink,
  Users,
  Calendar,
  Compass,
  AlertCircle,
  Building2,
  Printer,
  ChevronDown,
  Check,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { CenterId, TransportRoute, TransportStop } from '../types/transportation';
import { TRANSPORT_CENTERS, TRANSPORT_ROUTES } from '../data/transportationData';

export const TransportationPage: React.FC = () => {
  // Selected Center (default: Al Quoz)
  const [selectedCenterId, setSelectedCenterId] = useState<CenterId>('al_quoz');

  // Selected Route Filter within the chosen center ('all' or routeId)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');

  // Search input for stop name, landmark, or area
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Route Combobox dropdown open state & internal search filter
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const routeDropdownRef = useRef<HTMLDivElement>(null);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        routeDropdownRef.current &&
        !routeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRouteDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Selected center details
  const activeCenter = useMemo(() => {
    return (
      TRANSPORT_CENTERS.find((c) => c.id === selectedCenterId) ||
      TRANSPORT_CENTERS[0]
    );
  }, [selectedCenterId]);

  // Routes for current center
  const centerRoutes = useMemo(() => {
    return TRANSPORT_ROUTES.filter((r) => r.centerId === selectedCenterId);
  }, [selectedCenterId]);

  // When center changes, reset route selection & dropdown search
  const handleCenterChange = (centerId: CenterId) => {
    setSelectedCenterId(centerId);
    setSelectedRouteId('all');
    setRouteSearchTerm('');
    setIsRouteDropdownOpen(false);
  };

  // Currently selected route object (if specific route chosen)
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === 'all') return null;
    return centerRoutes.find((r) => r.id === selectedRouteId) || null;
  }, [centerRoutes, selectedRouteId]);

  // Routes list filtered by combobox search term
  const comboFilteredRoutes = useMemo(() => {
    if (!routeSearchTerm.trim()) return centerRoutes;
    const term = routeSearchTerm.toLowerCase();
    return centerRoutes.filter(
      (r) =>
        r.routeCode.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.stops.some(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.landmark.toLowerCase().includes(term)
        )
    );
  }, [centerRoutes, routeSearchTerm]);

  // Filtered routes based on selected route and search query
  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return centerRoutes.filter((route) => {
      if (selectedRouteId !== 'all' && route.id !== selectedRouteId) {
        return false;
      }

      if (!query) return true;

      // Match route title or route code
      if (
        route.routeCode.toLowerCase().includes(query) ||
        route.title.toLowerCase().includes(query)
      ) {
        return true;
      }

      // Match stop name or landmark
      const hasMatchingStop = route.stops.some(
        (stop) =>
          stop.name.toLowerCase().includes(query) ||
          stop.landmark.toLowerCase().includes(query)
      );

      return hasMatchingStop;
    });
  }, [centerRoutes, selectedRouteId, searchQuery]);

  // Total daily trips for current view
  const totalDailyTrips = useMemo(() => {
    return filteredRoutes.reduce((acc, r) => acc + r.trips.length, 0);
  }, [filteredRoutes]);

  // Total unique stops count for current view
  const totalUniqueStops = useMemo(() => {
    const stopIds = new Set<string>();
    filteredRoutes.forEach((r) =>
      r.stops.forEach((s) => stopIds.add(s.name.toLowerCase()))
    );
    return stopIds.size;
  }, [filteredRoutes]);

  // Reset all filters for this center
  const handleResetFilters = () => {
    setSelectedRouteId('all');
    setSearchQuery('');
    setRouteSearchTerm('');
    setIsRouteDropdownOpen(false);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Center Selection Tabs (Al Quoz Centre vs Dubai Industrial City Centre) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRANSPORT_CENTERS.map((center) => {
          const isSelected = selectedCenterId === center.id;
          return (
            <button
              key={center.id}
              onClick={() => handleCenterChange(center.id)}
              className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-gradient-to-br from-[#064E3B] to-[#006B45] text-white border-[#006B45] shadow-md ring-2 ring-[#006B45]/20'
                  : 'bg-white hover:bg-slate-50 text-[#0F172A] border-[#E2E8F0] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-white/10 text-emerald-200 border border-white/20'
                        : 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                            : 'bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5]'
                        }`}
                      >
                        {center.routesCount} Routes Available
                      </span>
                    </div>
                    <h3
                      className={`text-base sm:text-lg font-bold tracking-tight mt-1 ${
                        isSelected ? 'text-white' : 'text-[#0F172A]'
                      }`}
                    >
                      {center.name}
                    </h3>
                  </div>
                </div>

                {isSelected && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400 text-[#064E3B] text-[11px] font-bold shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Selected</span>
                  </span>
                )}
              </div>

              <p
                className={`mt-3 text-xs leading-relaxed ${
                  isSelected ? 'text-emerald-100/90' : 'text-[#64748B]'
                }`}
              >
                {center.description}
              </p>

              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                  isSelected
                    ? 'border-white/10 text-emerald-200'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{center.locationArea}</span>
                </div>
                <span className="font-semibold shrink-0">Daily 7 Days</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Modern Filter Bar: Clean Route Dropdown / Combo-Box + Search */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#006B45] flex items-center justify-center border border-[#D1FAE5]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">
                Transportation Filters
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Filter by Route or search specific pickup stops for{' '}
                <span className="font-semibold text-[#006B45]">
                  {activeCenter.shortName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(selectedRouteId !== 'all' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#006B45]" />
                <span className="hidden sm:inline">Reset Filters</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] hover:bg-[#D1FAE5] transition-colors"
              title="Print schedule"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid: Route Dropdown Combo-box + Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
          {/* A. Clean Modern Route Combo-Box (Col 1-7) */}
          <div className="md:col-span-7 relative" ref={routeDropdownRef}>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-[#006B45]" />
                <span>Select Route</span>
              </span>
              <span className="text-[10px] font-semibold text-[#64748B]">
                {centerRoutes.length} Available in {activeCenter.shortName}
              </span>
            </label>

            {/* Combobox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F8FAFC] border rounded-xl text-left transition-all text-xs sm:text-sm ${
                isRouteDropdownOpen
                  ? 'border-[#006B45] ring-2 ring-[#006B45]/20 bg-white'
                  : selectedRouteId !== 'all'
                  ? 'border-[#006B45] bg-[#F0FDF4]/40 font-medium'
                  : 'border-[#CBD5E1] hover:border-[#94A3B8] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                {activeRouteObj ? (
                  <>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#006B45] text-white shrink-0 shadow-2xs">
                      {activeRouteObj.routeCode}
                    </span>
                    <span className="truncate font-semibold text-[#0F172A]">
                      {activeRouteObj.title}
                    </span>
                    <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.2 rounded bg-slate-200 text-[#475569] shrink-0">
                      {activeRouteObj.trips.length} Trips • {activeRouteObj.capacity} Pax
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-200 text-[#475569] shrink-0">
                      ALL
                    </span>
                    <span className="font-semibold text-[#0F172A]">
                      All Routes ({centerRoutes.length} Lines)
                    </span>
                  </>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                  isRouteDropdownOpen ? 'rotate-180 text-[#006B45]' : ''
                }`}
              />
            </button>

            {/* Combobox Dropdown Menu */}
            {isRouteDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-[#CBD5E1] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Search inside combobox */}
                <div className="p-2 border-b border-[#E2E8F0] bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={routeSearchTerm}
                      onChange={(e) => setRouteSearchTerm(e.target.value)}
                      placeholder="Type route name or stop (e.g. Route 1, Sonapur)..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006B45] focus:border-[#006B45]"
                      autoFocus
                    />
                    {routeSearchTerm && (
                      <button
                        onClick={() => setRouteSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown Options List */}
                <div className="max-h-64 overflow-y-auto py-1 divide-y divide-[#F1F5F9]">
                  {/* Option: All Routes */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRouteId('all');
                      setIsRouteDropdownOpen(false);
                      setRouteSearchTerm('');
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors ${
                      selectedRouteId === 'all'
                        ? 'bg-[#F0FDF4] text-[#006B45] font-bold'
                        : 'hover:bg-slate-50 text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedRouteId === 'all'
                            ? 'bg-[#006B45] text-white'
                            : 'bg-slate-100 text-[#475569]'
                        }`}
                      >
                        ALL
                      </span>
                      <div>
                        <span className="font-semibold block">
                          All Routes in {activeCenter.shortName}
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          Show all {centerRoutes.length} lines simultaneously
                        </span>
                      </div>
                    </div>
                    {selectedRouteId === 'all' && (
                      <Check className="w-4 h-4 text-[#006B45] shrink-0" />
                    )}
                  </button>

                  {/* Individual Routes */}
                  {comboFilteredRoutes.map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => {
                          setSelectedRouteId(route.id);
                          setIsRouteDropdownOpen(false);
                          setRouteSearchTerm('');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-[#F0FDF4] text-[#006B45] font-bold'
                            : 'hover:bg-slate-50 text-[#0F172A]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-[#006B45] text-white'
                                  : 'bg-slate-200 text-[#0F172A]'
                              }`}
                            >
                              {route.routeCode}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              • {route.trips.length} Trips • {route.capacity} Pax
                            </span>
                          </div>
                          <p className="truncate font-semibold text-[#0F172A]">
                            {route.title}
                          </p>
                          <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                            {route.stops.map((s) => s.name).join(' → ')}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#006B45] shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}

                  {comboFilteredRoutes.length === 0 && (
                    <div className="p-4 text-center text-xs text-[#64748B]">
                      No routes match &quot;{routeSearchTerm}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* B. Search Input by Stop / Landmark / Area (Col 8-12) */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#006B45]" />
              <span>Search Stop, Landmark, or Area</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                <Search className="w-4 h-4 text-[#006B45]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Abu Hail, BurJuman, Sonapur, Nesto..."
                className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B45] focus:border-[#006B45] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#0F172A]"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* C. Active Route Summary Pill (When a specific route is selected) */}
        {activeRouteObj && (
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#64748B]">Filtered by:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0FDF4] text-[#064E3B] font-bold border border-[#D1FAE5]">
                <Bus className="w-3.5 h-3.5 text-[#006B45]" />
                <span>{activeRouteObj.routeCode}: {activeRouteObj.title}</span>
              </span>
              <span className="text-[11px] text-[#64748B]">
                ({activeRouteObj.trips.length} Departures • {activeRouteObj.capacity} Seater Coach)
              </span>
            </div>
            <button
              onClick={() => setSelectedRouteId('all')}
              className="text-xs text-[#006B45] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Show All {centerRoutes.length} Routes</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Center Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Displayed Lines
            </span>
            <span className="text-base font-bold text-[#0F172A]">
              {filteredRoutes.length} of {centerRoutes.length} Routes
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Scheduled Trips
            </span>
            <span className="text-base font-bold text-[#0F172A]">
              {totalDailyTrips} Departures
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Active Stations
            </span>
            <span className="text-base font-bold text-[#0F172A]">
              {totalUniqueStops} Official Stops
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#006B45] border border-[#D1FAE5] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Operating Days
            </span>
            <span className="text-base font-bold text-[#0F172A]">
              7 Days / Full Week
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#064E3B]">
        <AlertCircle className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span className="font-bold">Student Guidance:</span> Eco Drive provides complimentary transportation for registered students. Please arrive at your selected pickup point at least <strong>5 to 10 minutes</strong> before the scheduled departure time. Click the location links below to open the exact Google Maps navigation pin.
        </div>
      </div>

      {/* 4. Filtered Route Schedules */}
      {filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <Compass className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">
            No Matching Routes or Stops Found
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
            No route matches your filter in {activeCenter.name}. Try selecting
            &quot;All Routes&quot; or clearing your search term.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-[#006B45] text-white text-xs font-semibold rounded-xl hover:bg-[#064E3B] transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRoutes.map((route) => {
            return (
              <RouteScheduleCard
                key={route.id}
                route={route}
                searchQuery={searchQuery}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Single Route Card with interactive Stops timeline & Tabular Timetable
// ============================================================================
interface RouteScheduleCardProps {
  route: TransportRoute;
  searchQuery: string;
}

const RouteScheduleCard: React.FC<RouteScheduleCardProps> = ({
  route,
  searchQuery,
}) => {
  // Helper to highlight query matches
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-[#0F172A] rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden transition-all hover:border-[#CBD5E1]">
      {/* Route Header Banner */}
      <div className="bg-[#064E3B] text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
              {route.routeCode}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              {route.scheduleType}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-black/20 text-emerald-100 border border-white/10">
              <Users className="w-3 h-3 text-emerald-300" />
              <span>{route.capacity} Passengers Capacity</span>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {highlightMatch(route.title)}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#004d32] px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs text-right">
            <span className="block text-[10px] text-emerald-200/70 uppercase font-semibold">Total Trips</span>
            <span className="text-sm font-bold text-white">{route.trips.length} Departures</span>
          </div>
        </div>
      </div>

      {/* Stops Timeline / Navigation Links */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-4 sm:px-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#006B45]" />
          <span>Pick-up Stations & Precise GPS Pins:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {route.stops.map((stop: TransportStop, idx: number) => {
            return (
              <div
                key={stop.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between gap-2 shadow-2xs hover:border-[#006B45]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-[#475569] rounded">
                      Stop {idx + 1}
                    </span>
                    {stop.pinUrl && (
                      <span className="text-[9px] font-semibold text-[#006B45] flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>GPS Active</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug">
                    {highlightMatch(stop.name)}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                    {highlightMatch(stop.landmark)}
                  </p>
                </div>

                {stop.pinUrl ? (
                  <a
                    href={stop.pinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F0FDF4] hover:bg-[#D1FAE5] text-[#006B45] text-[11px] font-semibold border border-[#D1FAE5] transition-colors mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Google Maps</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-[#94A3B8] italic mt-1">
                    Designated stop at {stop.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[#475569] font-bold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center">Trip #</th>
              {route.stops.map((stop) => (
                <th key={stop.id} className="py-3 px-4 min-w-[130px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#006B45]" />
                    <span className="truncate">{stop.name}</span>
                  </div>
                  <span className="block text-[9px] font-normal text-[#64748B] lowercase">
                    pickup
                  </span>
                </th>
              ))}
              <th className="py-3 px-4 bg-[#ECFDF5] text-[#064E3B] min-w-[140px]">
                <div className="flex items-center gap-1 font-extrabold">
                  <MapPin className="w-3 h-3 text-[#059669]" />
                  <span>ETA {route.centerEtaName}</span>
                </div>
                <span className="block text-[9px] font-normal text-[#064E3B]/70">
                  arrival at institute
                </span>
              </th>
              <th className="py-3 px-4 bg-[#F0FDF4] text-[#064E3B] min-w-[140px]">
                <div className="flex items-center gap-1 font-extrabold">
                  <Bus className="w-3 h-3 text-[#059669]" />
                  <span>DEP {route.centerEtaName}</span>
                </div>
                <span className="block text-[9px] font-normal text-[#064E3B]/70">
                  return departure
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {route.trips.map((trip, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={trip.id}
                  className={`hover:bg-emerald-50/50 transition-colors ${
                    isEven ? 'bg-white' : 'bg-[#FAFAFA]'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-center text-[#64748B]">
                    <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-[#0F172A] leading-6 text-[11px]">
                      {idx + 1}
                    </span>
                  </td>

                  {/* Pickup times for each stop */}
                  {route.stops.map((stop) => {
                    const time = trip.stopTimes[stop.id];
                    return (
                      <td key={stop.id} className="py-3 px-4 font-medium text-[#0F172A]">
                        {time ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[#0F172A] font-semibold text-[11px]">
                            {time}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* ETA at Eco Drive */}
                  <td className="py-3 px-4 bg-[#ECFDF5]/50 font-bold text-[#064E3B]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D1FAE5] text-[#064E3B] text-xs">
                      {trip.eta}
                    </span>
                  </td>

                  {/* Departure from Eco Drive */}
                  <td className="py-3 px-4 bg-[#F0FDF4]/50 font-bold text-[#064E3B]">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#006B45] text-white text-xs w-max shadow-2xs">
                        {trip.departure}
                      </span>
                      {trip.notes && (
                        <span className="text-[10px] text-[#059669] font-medium mt-1">
                          {trip.notes}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
