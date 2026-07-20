import { api } from '@api/api';
import { BACKEND_FIELDS } from './form/formConfig';

/**
 * Build the multipart body for POST /records.
 *
 * FIELD ORDER MATTERS. The backend's upload middleware reads `type` off
 * `req.body` to pick the destination subfolder (`uploads/antiquity/...` vs
 * `uploads/bhs/...`); since multipart is parsed in order, `type` must be
 * appended BEFORE `image`. Any other order lands with a "type missing"
 * validation failure at the upload layer. All other text fields sit between
 * `type` and `image` — order among them doesn't matter, but we walk them in
 * canonical wire order (see BACKEND_FIELDS in formConfig) so a mid-body
 * append order shift can't quietly break anything later.
 *
 * Empty strings, nulls, and undefined values are skipped so we don't clutter
 * the multipart body with meaningless "".
 */
function buildRecordFormData({ values, image, type = 'ANTIQUITY' }) {
  const fd = new FormData();
  fd.append('type', type); // FIRST — required before `image` for the destination handler
  for (const key of BACKEND_FIELDS) {
    if (key === 'type') continue;
    const v = values?.[key];
    if (v === '' || v === null || v === undefined) continue;
    fd.append(key, v);
  }
  if (image) {
    fd.append('image', image, image.name); // LAST
  }
  return fd;
}

/**
 * Records endpoints — the backend serves one unified /records tree for both
 * antiquities and built-heritage sites, discriminated by a `type` field.
 * These hooks are named `useListAntiquitiesQuery` etc. for continuity with
 * the existing UI, but every request is scoped to `type: 'ANTIQUITY'`.
 * BHS will inject its own hooks against the same endpoints with `type: 'BHS'`.
 *
 * Each mutation invalidates the right tags so lists + detail refetch automatically.
 *
 * Notes on the wire contract (from swagger):
 *   - List: GET /records — filter by ?circle=&type=&status=. No server-side
 *     pagination, sort, or search — the frontend does those with useMemo.
 *   - Detail: GET /records/:id — returns base fields merged with type-specific
 *     detail row (key_no/accession_number/material/… for ANTIQUITY).
 *   - Create: multipart/form-data. The `type` field must appear before `image`
 *     because upload middleware reads type first to pick the subfolder.
 *     For now these hooks send JSON; multipart wiring lands with Phase C.
 *   - Publish: POST (not PATCH — earlier code had this wrong).
 */
export const antiquitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ---------- Queries ----------

    /**
     * GET /records?type=ANTIQUITY&circle=&status=
     * Backend enforces operator-only scoping — OPERATOR receives only own records.
     *
     * Response shape: `data` is a flat array of RecordSummary objects.
     * Pagination / sort / search are done client-side by AntiquitiesListPage.
     */
    listAntiquities: builder.query({
      query: (params = {}) => ({
        url: '/records',
        method: 'GET',
        params: { type: 'ANTIQUITY', ...params },
      }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Antiquity', id: 'LIST' },
              ...result.map((it) => ({ type: 'Antiquity', id: it.id })),
            ]
          : [{ type: 'Antiquity', id: 'LIST' }],
    }),

    /** GET /records/:id */
    getAntiquity: builder.query({
      query: (id) => ({ url: `/records/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Antiquity', id }],
    }),

    /**
     * GET /records/:id/history
     * Backend returns oldest-first; the timeline component reverses so the
     * newest event sits at the top. Open to every authenticated role.
     */
    getRecordHistory: builder.query({
      query: (id) => ({ url: `/records/${id}/history`, method: 'GET' }),
      // Piggyback on the Antiquity tag so mutations (forward/return/reject/publish)
      // automatically refetch history too — no extra invalidation wiring needed.
      providesTags: (result, error, id) => [{ type: 'Antiquity', id }],
    }),

    // ---------- Mutations ----------

    /**
     * POST /records — creates a new DRAFT record at OPERATOR level.
     * Sends multipart/form-data with `type` first and `image` last
     * (see buildRecordFormData for why).
     *
     * @param body { values: object, image: File | null }
     */
    createAntiquity: builder.mutation({
      query: ({ values, image }) => ({
        url: '/records',
        method: 'POST',
        data: buildRecordFormData({ values, image, type: 'ANTIQUITY' }),
      }),
      invalidatesTags: [{ type: 'Antiquity', id: 'LIST' }],
    }),

    /**
     * PUT /records/:id — edit a record.
     *
     * Multipart body, same shape as create. `type` is sent first for the
     * upload middleware's destination handler (needed only if `image` is
     * present, but we always send it for parity with POST). `image` is
     * OPTIONAL — omit to keep the existing image on the server.
     *
     * Backend enforces role + status permission:
     *   - OPERATOR: own DRAFT or RETURNED
     *   - ADMIN: any PENDING_ADMIN
     *   - SUPERADMIN: any PENDING_SUPERADMIN
     *   - Others: never
     *   - PUBLISHED / REJECTED: terminal, never editable
     *
     * Immutable fields (key_no, bh_code, ledger_key, blockchain_tx, status,
     * current_level, created_by, created_at) are stripped here BEFORE the
     * multipart is built — the backend rejects any request that includes
     * them, and it's cleaner to drop them than to have the form worry.
     */
    updateAntiquity: builder.mutation({
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
          data: buildRecordFormData({ values: editable, image, type: 'ANTIQUITY' }),
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Antiquity', id },
        { type: 'Antiquity', id: 'LIST' },
      ],
    }),

    /**
     * POST /records/:id/forward — move to the next workflow stage.
     * Body: { note?: string }
     */
    forwardAntiquity: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/forward`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Antiquity', id },
        { type: 'Antiquity', id: 'LIST' },
      ],
    }),

    /**
     * POST /records/:id/return — send back one workflow level.
     * Body: { note: string } — required by backend.
     */
    returnAntiquity: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/return`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Antiquity', id },
        { type: 'Antiquity', id: 'LIST' },
      ],
    }),

    /**
     * POST /records/:id/reject — terminal. Body: { note: string } — required.
     */
    rejectAntiquity: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/records/${id}/reject`,
        method: 'POST',
        data: { note: comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Antiquity', id },
        { type: 'Antiquity', id: 'LIST' },
      ],
    }),

    /**
     * POST /records/:id/publish — SUPERADMIN only. Anchors to Fabric,
     * flips to PUBLISHED, returns the record with `blockchain_tx` populated.
     *
     * Error semantics we care about at the UI layer:
     *   - 503 → ledger unreachable, record untouched, safe to retry.
     *           The PublishModal handles this as a distinct "unavailable"
     *           step with a Retry button, per the D2 flow.
     *   - 409 → terminal state or on-ledger drift (rare).
     *   - 403 → not SUPERADMIN / not holder (UI should prevent the click,
     *           but we surface the message if it fires anyway).
     *
     * `note` is optional per swagger — we only send it when the caller
     * provided one, no dummy "Published" filler.
     */
    publishAntiquity: builder.mutation({
      query: ({ id, comment }) => {
        const data = {};
        if (comment && comment.trim()) data.note = comment.trim();
        return {
          url: `/records/${id}/publish`,
          method: 'POST',
          data,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Antiquity', id },
        { type: 'Antiquity', id: 'LIST' },
      ],
    }),

    /**
     * GET /records/:id/verify — recompute record + image hashes and compare
     * with the on-ledger asset. Open to every authenticated role.
     *
     * Response is a oneOf:
     *   - VerifyComparison  → { verified, contentMatch, imageMatch, txId }
     *   - VerifyUnavailable → { verified, reason: 'NOT_ANCHORED' | 'NOT_FOUND_ON_LEDGER' }
     *
     * Branch on `reason` FIRST — the match fields are absent (not false)
     * in the unavailable variant. See TrustAnchorCard for the UI mapping.
     *
     * Exposed as a lazy query so it only fires when the user clicks the
     * Verify button (not on mount). Each verify call is a fresh fetch —
     * we don't want stale "verified" state carrying over if the record
     * changed on the ledger between visits.
     */
    verifyRecord: builder.query({
      query: (id) => ({ url: `/records/${id}/verify`, method: 'GET' }),
      // Deliberately no providesTags — verify is one-shot per click,
      // not cache-driven. Refetch is always explicit via the lazy trigger.
    }),
  }),
});

export const {
  useListAntiquitiesQuery,
  useGetAntiquityQuery,
  useGetRecordHistoryQuery,
  useCreateAntiquityMutation,
  useUpdateAntiquityMutation,
  useForwardAntiquityMutation,
  useReturnAntiquityMutation,
  useRejectAntiquityMutation,
  usePublishAntiquityMutation,
  useLazyVerifyRecordQuery,
} = antiquitiesApi;
