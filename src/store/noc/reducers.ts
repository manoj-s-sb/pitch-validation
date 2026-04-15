import { createSlice } from '@reduxjs/toolkit';
import { checkHealth, checkStatus, checkLaneStatus } from './api';
import { initialState } from './types';

const nocSlice = createSlice({
  name: 'noc',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // /health
    builder
      .addCase(checkHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.health = action.payload;
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // /status
    builder
      .addCase(checkStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(checkStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // /{laneId}/status
    builder
      .addCase(checkLaneStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkLaneStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.laneStatus = action.payload;
      })
      .addCase(checkLaneStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default nocSlice.reducer;
