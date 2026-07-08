import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App.jsx';
import { store } from '@app/store';
import { setUnauthorizedHandler } from '@api/axios';
import { logout } from '@features/auth/authSlice';
import { api } from '@api/api';

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
 * Start MSW in development. Bundled in prod but never started —
 * real backend takes over via the same axios base URL.
 */
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') return;
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
});
