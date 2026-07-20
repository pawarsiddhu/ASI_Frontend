import { api } from '@api/api';

/**
 * Circles endpoint — GET /circles returns the list of ASI circle codes
 * available for record assignment.
 *
 * Wire shape (after the base-query envelope unwrap):
 *   ["AGRA", "AURANGABAD", "BENGALURU", ...]
 *
 * The backend is authoritative for WHICH circles exist. We enrich each code
 * with a display label via getCircleLabel() at the useCircles() layer, not
 * here — keeping this endpoint a thin fetch means the cache stores exactly
 * what the wire returned and diffs cleanly.
 *
 * Cached aggressively (1h): the list of circles changes rarely and never
 * mid-session in practice. Consumers get one network call per app load.
 */
export const circlesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCircles: builder.query({
      query: () => ({ url: '/circles', method: 'GET' }),
      keepUnusedDataFor: 3600, // 1h
      providesTags: [{ type: 'Circle', id: 'LIST' }],
    }),
  }),
});

export const { useGetCirclesQuery } = circlesApi;
