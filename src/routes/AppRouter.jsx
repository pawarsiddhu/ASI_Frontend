import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import RootRedirect from './RootRedirect';

import AppShell from '@layouts/AppShell';
import Spinner from '@components/Spinner';
import { ROLES } from '@utils/constants';

// Login/Unauthorized/NotFound are small and always needed — no lazy split.
import LoginPage from '@features/auth/LoginPage';
import UnauthorizedPage from '@features/auth/UnauthorizedPage';
import NotFoundPage from '@features/NotFoundPage';

// Dashboards are lazy-loaded. Each becomes its own bundle chunk.
// Result: Operator's browser never downloads the Admin dashboard code.
const OperatorDashboard = lazy(() =>
  import('@features/dashboard/operator/OperatorDashboard')
);
const SupervisorDashboard = lazy(() =>
  import('@features/dashboard/supervisor/SupervisorDashboard')
);
const AdminDashboard = lazy(() =>
  import('@features/dashboard/admin/AdminDashboard')
);
const SuperAdminDashboard = lazy(() =>
  import('@features/dashboard/superadmin/SuperAdminDashboard')
);
const RDDashboard = lazy(() =>
  import('@features/dashboard/rd/RDDashboard')
);

// Antiquities feature routes
const AntiquitiesListPage = lazy(() =>
  import('@features/antiquities/AntiquitiesListPage')
);
const AntiquityCreatePage = lazy(() =>
  import('@features/antiquities/AntiquityCreatePage')
);

/**
 * Wrap the lazy dashboards in a shared Suspense fallback.
 * Placed inside the AppShell so the shell stays visible while a chunk loads —
 * only the main content area shows the spinner, header + sidebar don't flash.
 */
const LazyBoundary = ({ children }) => (
  <Suspense fallback={<Spinner centered label="Loading page" />}>
    {children}
  </Suspense>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* --- Authenticated --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<RootRedirect />} />

            <Route element={<RoleGuard allowedRoles={[ROLES.OPERATOR]} />}>
              <Route
                path="/operator"
                element={<LazyBoundary><OperatorDashboard /></LazyBoundary>}
              />
            </Route>

            <Route element={<RoleGuard allowedRoles={[ROLES.SUPERVISOR]} />}>
              <Route
                path="/supervisor"
                element={<LazyBoundary><SupervisorDashboard /></LazyBoundary>}
              />
            </Route>

            <Route element={<RoleGuard allowedRoles={[ROLES.ADMIN]} />}>
              <Route
                path="/admin"
                element={<LazyBoundary><AdminDashboard /></LazyBoundary>}
              />
            </Route>

            <Route element={<RoleGuard allowedRoles={[ROLES.SUPERADMIN]} />}>
              <Route
                path="/superadmin"
                element={<LazyBoundary><SuperAdminDashboard /></LazyBoundary>}
              />
            </Route>

            <Route element={<RoleGuard allowedRoles={[ROLES.RD]} />}>
              <Route
                path="/rd"
                element={<LazyBoundary><RDDashboard /></LazyBoundary>}
              />
            </Route>

            {/* Antiquities — universal route, data scoped server-side by role */}
            <Route
              path="/records/antiquities"
              element={<LazyBoundary><AntiquitiesListPage /></LazyBoundary>}
            />
            <Route
              path="/records/antiquities/new"
              element={<LazyBoundary><AntiquityCreatePage /></LazyBoundary>}
            />
          </Route>
        </Route>

        {/* --- 404 --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
