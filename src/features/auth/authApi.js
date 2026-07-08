import { api } from '@api/api';

/**
 * Auth endpoints — login, getMe, logout.
 * Injected into the root api so we share cache, tags, middleware.
 */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /auth/login — returns { token, user }
     * @param credentials { email: string, password: string }
     */
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
    }),

    /**
     * GET /auth/me — returns { user }
     * Fired on app boot with the persisted token to rehydrate the user.
     * Tag 'CurrentUser' so we can invalidate on profile changes later.
     */
    getMe: builder.query({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['CurrentUser'],
    }),

    /**
     * POST /auth/logout — server-side session cleanup (no-op in mock).
     */
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi;
