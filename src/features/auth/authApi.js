import { api } from '@api/api';

/**
 * Auth endpoints. The backend exposes exactly one — POST /auth/login —
 * so this file has exactly one endpoint.
 *
 * There is no `/auth/me` (session rehydrates from localStorage; see
 * authStorage.js) and no `/auth/logout` (JWTs are stateless; logout is
 * a client-side localStorage clear).
 */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /auth/login
     * @param credentials { username: string, password: string }
     * @returns { token: string, user: { id, username, role } }
     */
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
    }),
  }),
});

export const { useLoginMutation } = authApi;
