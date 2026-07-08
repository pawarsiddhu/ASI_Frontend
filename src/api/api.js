import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

/**
 * Root RTK Query API. Feature slices (authApi, antiquitiesApi, ...) inject
 * their endpoints via `api.injectEndpoints()`. Keeping one createApi call
 * means one middleware, one cache, one tag namespace.
 *
 * Tag types declared here up front so autocomplete works everywhere.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CurrentUser', 'Antiquity', 'BHS', 'ArchSite', 'Report', 'User'],
  endpoints: () => ({}),
});
