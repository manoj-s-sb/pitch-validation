import { createAsyncThunk } from '@reduxjs/toolkit';
import { nocLocalApi } from '../../services';
import { NOC_LOCAL } from '../../constants/endpoints';

export const checkHealth = createAsyncThunk('noc/checkHealth', async (_, { rejectWithValue }) => {
  try {
    const resp = await nocLocalApi.get(NOC_LOCAL.HEALTH);
    return resp.data;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const checkStatus = createAsyncThunk(
  'noc/checkStatus',
  async (laneId: string | undefined, { rejectWithValue }) => {
    try {
      const resp = await nocLocalApi.get(`${laneId ? `${laneId}/` : ''}${NOC_LOCAL.STATUS}`);
      return resp.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);
