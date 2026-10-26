export type CenterId = 'al_quoz' | 'dic';

export interface TransportCenter {
  id: CenterId;
  name: string;
  shortName: string;
  locationArea: string;
  badge: string;
  description: string;
  routesCount: number;
}

export interface TransportStop {
  id: string;
  name: string;
  landmark: string;
  pinUrl?: string;
}

export interface TransportTrip {
  id: string;
  stopTimes: Record<string, string>; // stopId -> time (e.g., "5:30AM")
  eta: string;
  departure: string;
  notes?: string;
}

export interface TransportRoute {
  id: string;
  centerId: CenterId;
  routeCode: string; // e.g. "ROUTE 1", "ROUTE 2", "DIC INTERNAL"
  title: string;
  scheduleType: string; // e.g. "FULL WEEK SCHEDULE"
  capacity: number; // e.g. 24 or 12
  stops: TransportStop[];
  centerEtaName: string; // e.g. "ECO DRIVE AL QUOZ" or "ECO DRIVE - DIC"
  trips: TransportTrip[];
}
