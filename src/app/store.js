import { configureStore } from '@reduxjs/toolkit';
import { api } from '@api/api';
import authReducer from '@features/auth/authSlice';

/**
 * Root store. RTK Query mounts its own reducer at `api.reducerPath` and
 * needs its middleware in the chain. Everything else is plain slices.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

// (Type export not needed since we're JS, but re-exports live here in TS setups)
