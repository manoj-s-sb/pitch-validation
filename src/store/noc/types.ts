export interface Resource {
  checkedAt: string;
  description: string;
  since: string;
  status: 'online' | 'offline' | 'warning';
}

export interface Lane {
  healthy: boolean;
  laneId: number;
  resources: Record<string, Resource>;
}

export interface HealthResponse {
  facility: string;
  status: 'healthy' | 'degraded';
  timestamp: string;
}

export interface StatusResponse {
  facility: string;
  lanes: Record<string, Lane>;
  totalLanes: number;
  lastSummary: string;
  timestamp: string;
}

export interface LaneStatusResponse {
  facility: string;
  lane: string;
  laneId: number;
  healthy: boolean;
  resources: Record<string, Resource>;
  timestamp: string;
}

export interface NocState {
  health: HealthResponse | null;
  status: StatusResponse | null;
  laneStatus: LaneStatusResponse | null;
  loading: boolean;
  error: string | null;
}

export const initialState: NocState = {
  health: null,
  status: null,
  laneStatus: null,
  loading: false,
  error: null,
};
