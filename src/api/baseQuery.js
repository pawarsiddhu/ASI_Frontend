import axios from './axios';

/**
 * Backend response envelope:
 *   success → { success: true, message, data }
 *   failure → { success: false, message, errors? }
 *
 * We unwrap `data` here so downstream endpoints see flat records.
 * For error responses we surface `{ message, errors }` under `error.data`
 * so consumers can read `err.data.message` / `err.data.errors`.
 *
 * MSW mocks that predate the envelope may return the flat payload directly;
 * we detect that and pass it through unchanged (`success` key absent).
 */
function unwrapEnvelope(payload) {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload.data !== undefined ? payload.data : payload;
  }
  return payload;
}

function unwrapErrorEnvelope(payload, fallbackMessage) {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    return { message: payload.message ?? fallbackMessage, errors: payload.errors };
  }
  return payload ?? { message: fallbackMessage };
}

/**
 * axiosBaseQuery — adapter so RTK Query can use our axios instance.
 *
 * Why bother? RTK Query's built-in fetchBaseQuery is fine, but we want:
 *   - the JWT interceptor already living in axios
 *   - one place that decides how errors are shaped
 *   - one place that unwraps the backend response envelope
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
      return { data: unwrapEnvelope(result.data) };
    } catch (err) {
      return {
        error: {
          status: err.response?.status ?? 'FETCH_ERROR',
          data: unwrapErrorEnvelope(err.response?.data, err.message),
        },
      };
    }
  };
