import { API_BASE_URL, USE_MOCKS } from '@utils/constants';

/**
 * Phase A boot-time health check.
 *
 * Purpose: give the developer an immediate "is the backend reachable?" signal
 * in the browser console the moment the app loads, BEFORE the user even tries
 * to log in. That way, if login fails, we already know whether the failure is
 * at the network/CORS layer (health failed too) or at the login layer
 * specifically (health succeeded, login didn't).
 *
 * Why plain fetch instead of the axios instance:
 *   - `/health` is the one route the backend does NOT wrap in the response
 *     envelope, so it doesn't need envelope unwrap.
 *   - No auth is required.
 *   - We want zero interceptor behaviour — the axios instance would attach a
 *     stale Bearer token if one is in localStorage, which the health route
 *     ignores but which pollutes the diagnostic.
 *
 * Skipped when VITE_USE_MOCKS=true — there is no real backend to probe then,
 * and MSW's `bypass` policy means the request would go to the network anyway
 * and produce a misleading "network error" log.
 */
export async function runHealthCheck() {
  if (USE_MOCKS) return;

  const url = `${API_BASE_URL}/health`;
  const label = '[Phase A] Health check';

  try {
    const response = await fetch(url, { method: 'GET' });
    const body = await response.json().catch(() => null);

    if (response.ok && body?.status === 'ok') {
      // eslint-disable-next-line no-console
      console.info(`${label}: OK — backend reachable at ${API_BASE_URL}`, body);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `${label}: unexpected response (HTTP ${response.status})`,
        body
      );
    }
  } catch (err) {
    // Most likely causes: CORS block (backend running but rejecting origin),
    // network unreachable (VM down), or DNS failure.
    // eslint-disable-next-line no-console
    console.error(
      `${label}: FAILED — could not reach ${url}. ` +
        `Common causes: (1) backend VM is down, ` +
        `(2) CORS is not configured for http://localhost:5173, ` +
        `(3) firewall/VPN. Error: ${err.message}`
    );
  }
}
