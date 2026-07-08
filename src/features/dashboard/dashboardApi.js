import { api } from '@api/api';

/**
 * Dashboard endpoints. One call per dashboard mount returns stats + activity
 * + chart in a single payload — simpler than 3 endpoints for a screen this
 * small. Split later if we need per-widget refetch.
 */
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => ({ url: '/dashboard', method: 'GET' }),
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
