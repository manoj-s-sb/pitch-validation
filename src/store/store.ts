import { configureStore } from '@reduxjs/toolkit';
import nocReducer from './noc/reducers';
import maintenanceReducer from './maintenance/reducers';

export const store = configureStore({
  reducer: {
    noc: nocReducer,
    maintenance: maintenanceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
