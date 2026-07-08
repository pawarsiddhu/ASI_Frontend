import { api } from '@api/api';

/**
 * Antiquities endpoints. Real backend contract is documented here.
 */
export const antiquitiesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /antiquities
     * @param {object} params
     * @param {number} [params.page=1]
     * @param {number} [params.pageSize=25]
     * @param {string} [params.search]
     * @param {string} [params.status]
     * @param {string} [params.circle]
     * @param {string} [params.category]
     * @param {'updatedAt'|'recordedAt'|'name'|'status'} [params.sortBy='updatedAt']
     * @param {'asc'|'desc'} [params.sortOrder='desc']
     * @returns {{ items, total, page, pageSize, totalPages }}
     */
    listAntiquities: builder.query({
      query: (params = {}) => ({
        url: '/antiquities',
        method: 'GET',
        params,
      }),
      // Tag the whole list AND every individual item — so a mutation on one
      // item can invalidate ('Antiquity', id) without blowing the whole list.
      providesTags: (result) =>
        result
          ? [
              { type: 'Antiquity', id: 'LIST' },
              ...result.items.map((it) => ({ type: 'Antiquity', id: it.id })),
            ]
          : [{ type: 'Antiquity', id: 'LIST' }],
    }),

    /**
     * GET /antiquities/:id
     */
    getAntiquity: builder.query({
      query: (id) => ({ url: `/antiquities/${id}`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: 'Antiquity', id }],
    }),

    /**
     * POST /antiquities — creates a new record.
     * On success, invalidates the list so it refetches.
     * Backend derives recordedBy from the JWT; frontend only sends the form fields.
     */
    createAntiquity: builder.mutation({
      query: (body) => ({
        url: '/antiquities',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Antiquity', id: 'LIST' }],
    }),
  }),
});

export const {
  useListAntiquitiesQuery,
  useGetAntiquityQuery,
  useCreateAntiquityMutation,
} = antiquitiesApi;
