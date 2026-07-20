import { ToastProvider } from '@components/Toast';
import AppRouter from '@routes/AppRouter';

/**
 * App root. Session state is rehydrated synchronously by the auth slice
 * from localStorage — see `authStorage.js` and `authSlice.js`. No async
 * hydrator component is needed on boot.
 */
export default function App() {
  return (
    <ToastProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppRouter />
    </ToastProvider>
  );
}
