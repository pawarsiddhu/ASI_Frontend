import { api } from '@api/api';

/**
 * Field names the backend accepts on POST /records for BHS, in canonical
 * wire order. `type` is FIRST because upload middleware reads it before
 * choosing the destination subfolder (uploads/bhs/...). `image` is LAST.
 */
export const BHS_BACKEND_FIELDS = [
  'type',
  'title',
  'circle',
  'bh_code',
  'latitude',
  'longitude',
  'state',
  'district',
  'category',
  'protection_status',
  'period',
  'condition',
  // image appended last
];

/**
 * Build the multipart body for POST /records (BHS variant).
 *
 * Same rules as antiquities:
 *   - `type` FIRST (upload middleware needs it before `image`)
 *   - `image` LAST
 *   - Empty / null values skipped so we don't clutter the payload
 *
 * lat/lng are numbers in the form state; multipart accepts them as strings —
 * FormData coerces via String() so no explicit conversion needed.
 */
function buildBHSFormData({ values, image }) {
  const fd = new FormData();
  fd.append('type', 'BHS');
  for (const key of BHS_BACKEND_FIELDS) {
    if (key === 'type') continue;
    const v = values?.[key];
    if (v === '' || v === null || v === undefined) continue;
    fd.append(key, v);
  }
  if (image) {
    fd.append('image', image, image.name);
  }
  return fd;
}

/**
 * BHS endpoints — unified with antiquities on /records, discriminated by
 * `type: 'BHS'`. Every hook name is prefixed BHS to keep call sites obvious.
 * Cache tag namespace 'BHS' is separate from 'Antiquity' so mutations to one
 * type don't invalidate the other's lists.
 */
export const bhsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- Queries ----------

    /**
     * GET /records?type=BHS&circle=&status=
     * Backend enforces operator-only scoping.
     */
    listBHS: builder.query({
      query: (params = {}) => ({
        url: '/records',
        method: 'GET',
        params: { type: 'BHS', ...params },
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'BHS', id: 'LIST' },
              ...result.map((it) => ({ type: 'BHS', id: it.id })),
            ]
          : [{ type: 'BHS', id: 'LIST' }],
    }),

    /** GET /records/:id — same endpoint, type-agnostic. */
    getBHS: builder.query({
      query: (id) => ({ url: `/records/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'BHS', id }],
    }),

    /**
     * GET /records/:id/history — identical shape to antiquity history.
     * Tagged under 'BHS' so BHS workflow mutations refresh it automatically.
     */
    getBHSHistory: builder.query({
      query: (id) => ({ url: `/records/${id}/history`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'BHS', id }],
    }),

    // ---------- Mutations ----------

    /**
     * POST /records — creates a BHS DRAFT at OPERATOR level.
     * Multipart body: `type` first, `image` last.
     */
    createBHS: builder.mutation({
      query: ({ values, image }) => ({
        url: '/records',
        method: 'POST',
        data: buildBHSFormData({ values, image }),
      }),
      invalidatesTags: [{ type: 'BHS', id: 'LIST' }],
    }),

    /**
     * PUT /records/:id — edit a BHS record. Same semantics as antiquity
     * update: multipart body, image optional, immutable fields stripped
     * before the multipart is built (backend rejects any request that
     * includes them). Backend permission is role + status based; see
     * updateAntiquity for the full matrix.
     */
    updateBHS: builder.mutation({
      query: ({ id, values, image }) => {
        const {
          key_no: _keyNo,
          bh_code: _bhCode,
          ledger_key: _ledger,
          blockchain_tx: _tx,
          status: _s,
          current_level: _cl,
          created_by: _cb,
          created_at: _ca,
          ...editable
        } = values || {};
        return {
          url: `/records/${id}`,
          method: 'PUT',
          data: buildBHSFormData({ values: editable, image }),
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'BHS', id },
        { type: 'BHS', id: 'LIST' },
      ],
    }),

    /** POST /records/:id/forward */
    forwardBHS: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/forward`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BHS', id },
        { type: 'BHS', id: 'LIST' },
      ],
    }),

    /** POST /records/:id/return (note required) */
    returnBHS: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/return`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BHS', id },
        { type: 'BHS', id: 'LIST' },
      ],
    }),

    /** POST /records/:id/reject (note required, terminal) */
    rejectBHS: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/reject`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BHS', id },
        { type: 'BHS', id: 'LIST' },
      ],
    }),

    /**
     * POST /records/:id/publish — same semantics as antiquity publish:
     * 200 success, 503 ledger-unreachable (safe to retry), 409 terminal,
     * 403 not-holder.
     */
    publishBHS: builder.mutation({
      query: ({ id, comment }) => {
        const data = {};
        if (comment && comment.trim()) data.note = comment.trim();
        return { url: `/records/${id}/publish`, method: 'POST', data };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'BHS', id },
        { type: 'BHS', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListBHSQuery,
  useGetBHSQuery,
  useGetBHSHistoryQuery,
  useCreateBHSMutation,
  useUpdateBHSMutation,
  useForwardBHSMutation,
  useReturnBHSMutation,
  useRejectBHSMutation,
  usePublishBHSMutation,
} = bhsApi;

// Verify uses the shared record endpoint — no BHS-specific hook needed.
// TrustAnchorCard's existing useLazyVerifyRecordQuery from antiquitiesApi
// works for BHS records too since the endpoint is /records/:id/verify.
