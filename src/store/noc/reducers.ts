import { createSlice } from '@reduxjs/toolkit';
import { checkHealth } from './api';
import { initialState } from './types';

const nocSlice = createSlice({
  name: 'noc',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
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
  },
});

export default nocSlice.reducer;
