import { api } from '@api/api';

/**
 * Map Explorer endpoints.
 *
 * Contract (mocked in MSW today, to be built on the real backend).
 * Staff endpoints need a login; /public/* endpoints don't:
 *   GET /map/masters                → { periods, dynasties, categories, ... }
 *   GET /map/features?layer=bhs     → GeoJSON FeatureCollection (Point = site)
 *   GET /map/features?layer=antiquities
 *                                   → GeoJSON FeatureCollection (Point = findspot,
 *                                     geometry null when findspot unknown)
 *
 * The demo fetches each layer once and filters in the browser, which keeps
 * the time slider instant. At production volume the server should accept
 * `bbox`, `period_id`, `from_year`, `to_year` etc. and filter in PostGIS.
 */
export const mapApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMapMasters: builder.query({
      query: () => ({ url: '/map/masters', method: 'GET' }),
      keepUnusedDataFor: 600,
    }),
    getMapFeatures: builder.query({
      query: (layer) => ({ url: '/map/features', method: 'GET', params: { layer } }),
      keepUnusedDataFor: 300,
    }),

    // Public (no login). The server returns only published records, with
    // sensitive coordinates already generalised and restricted fields removed.
    getPublicMapMasters: builder.query({
      query: () => ({ url: '/public/map/masters', method: 'GET' }),
      keepUnusedDataFor: 600,
    }),
    getPublicMapFeatures: builder.query({
      query: (layer) => ({ url: '/public/map/features', method: 'GET', params: { layer } }),
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetMapMastersQuery,
  useGetMapFeaturesQuery,
  useGetPublicMapMastersQuery,
  useGetPublicMapFeaturesQuery,
} = mapApi;
