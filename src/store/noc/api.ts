import { createAsyncThunk } from '@reduxjs/toolkit';
import { nocLocalApi } from '../../services';
import { NOC_LOCAL } from '../../constants/endpoints';

// GET /health
// Response: { facility, status: "healthy"|"degraded", timestamp }
export const checkHealth = createAsyncThunk('noc/checkHealth', async (_, { rejectWithValue }) => {
  try {
    const resp = await nocLocalApi.get(NOC_LOCAL.HEALTH);
    return resp.data;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

// GET /status
// Response: { facility, lanes: { "Lane 1": { healthy, laneId, resources }, ... }, totalLanes, lastSummary, timestamp }
export const checkStatus = createAsyncThunk('noc/checkStatus', async (_, { rejectWithValue }) => {
  try {
    const resp = await nocLocalApi.get(NOC_LOCAL.STATUS);
    return resp.data;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

// GET /{laneId}/status
// Response: { facility, lane, laneId, healthy, resources, timestamp }
export const checkLaneStatus = createAsyncThunk(
  'noc/checkLaneStatus',
  async (laneId: number, { rejectWithValue }) => {
    try {
      const resp = await nocLocalApi.get(`${laneId}${NOC_LOCAL.LANE_STATUS}`);
      return resp.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);
