import { api } from '@api/api';

/**
 * Public read endpoints — /public/records/antiquity and /public/records/bhs.
 *
 * Both are unauthenticated GETs returning arrays of published records. The
 * envelope is unwrapped by axiosBaseQuery, so downstream sees a plain array.
 *
 * Row shape (per swagger + Sid's example payload):
 *   { id, title, reference_number, state?, image, updated_at }
 *
 * No query params on the wire — filter / sort / paginate is client-side.
 */
export const publicSearchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listPublicAntiquities: builder.query({
      query: () => ({ url: '/public/records/antiquity', method: 'GET' }),
    }),
    listPublicBhs: builder.query({
      query: () => ({ url: '/public/records/bhs', method: 'GET' }),
    }),
  }),
});

export const {
  useListPublicAntiquitiesQuery,
  useListPublicBhsQuery,
} = publicSearchApi;
