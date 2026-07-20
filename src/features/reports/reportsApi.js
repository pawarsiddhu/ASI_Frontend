import { api } from '@api/api';

/**
 * Reports endpoints. Kept intentionally small — one endpoint per record type,
 * parameterized by dimension + date range. The MSW handler does the grouping.
 */
export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /reports/antiquities?dimension=<circle|museum|state|status|category>
     *                           &from=YYYY-MM-DD&to=YYYY-MM-DD
     *
     * Returns:
     *   {
     *     dimension, from, to,
     *     totals: { all, published, draft, ... perStatus },
     *     rows: [{ key, label, total, byStatus: {...} }, ...]
     *   }
     */
    getAntiquityReport: builder.query({
      query: (params = {}) => ({
        url: '/reports/antiquities',
        method: 'GET',
        params,
      }),
      // Tag the report result so future workflow mutations (forward/return/reject/publish)
      // could invalidate it if we ever want reports to auto-refresh.
      providesTags: [{ type: 'Report', id: 'ANTIQUITY' }],
    }),
  }),
});

export const { useGetAntiquityReportQuery } = reportsApi;
