import axios from './axios';

/**
 * axiosBaseQuery — adapter so RTK Query can use our axios instance.
 *
 * Why bother? RTK Query's built-in fetchBaseQuery is fine, but we want:
 *   - the JWT interceptor already living in axios
 *   - one place that decides how errors are shaped
 *   - the option to hook Axios plugins later (progress events for uploads, etc.)
 *
 * Endpoints call it like:
 *   builder.query({ query: () => ({ url: '/records', method: 'GET' }) })
 *
 * @returns {(args: { url: string, method?: string, data?: unknown, params?: unknown }) => Promise<{data:any}|{error:any}>}
 */
export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await axios({ url, method, data, params });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status ?? 'FETCH_ERROR',
          data: err.response?.data ?? { message: err.message },
        },
      };
    }
  };
