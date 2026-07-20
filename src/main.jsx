import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App.jsx';
import { store } from '@app/store';
import { setUnauthorizedHandler } from '@api/axios';
import { logout } from '@features/auth/authSlice';
import { api } from '@api/api';
import { runHealthCheck } from '@api/healthCheck';
import { USE_MOCKS, API_BASE_URL } from '@utils/constants';

// Leaflet's own stylesheet — must load once, globally, before any MapContainer
// mounts. The BHS location picker + detail viewer rely on it for tile layout,
// controls, and popup positioning.
import 'leaflet/dist/leaflet.css';

import '@styles/global.css';

/**
 * When any API call comes back 401, clear local auth state.
 * ProtectedRoute will then redirect the user to /login.
 */
setUnauthorizedHandler(() => {
  store.dispatch(logout());
  store.dispatch(api.util.resetApiState());
});

/**
 * Start MSW when VITE_USE_MOCKS=true. When false, requests go straight
 * to VITE_API_BASE_URL. The toggle stays after integration so we can
 * demo controlled error states (503, verify mismatches) from mocks
 * even when the real backend is otherwise the source of truth.
 */
async function enableMocking() {
  if (!USE_MOCKS) {
    // eslint-disable-next-line no-console
    console.info(
      `[ASI] Mocks disabled. Requests will hit ${API_BASE_URL}. ` +
        `Flip VITE_USE_MOCKS=true in .env.development to switch back to MSW.`
    );
    return;
  }
  const { worker } = await import('./mocks/browser');
  // eslint-disable-next-line no-console
  console.info('[ASI] Mocks enabled — MSW intercepting requests.');
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

enableMocking().then(() => {
  // Fire-and-forget: probes the real backend when mocks are off and logs the
  // result to the browser console. Not awaited — we don't want a slow/failed
  // health check to delay the app from rendering.
  runHealthCheck();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
});
