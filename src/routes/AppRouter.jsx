import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import RootRedirect from './RootRedirect';

import AppShell from '@layouts/AppShell';
import PublicShell from '@layouts/PublicShell';
import Spinner from '@components/Spinner';
import { ROLES } from '@utils/constants';

// Login/Unauthorized/NotFound are small and always needed — no lazy split.
import LoginPage from '@features/auth/LoginPage';
import UnauthorizedPage from '@features/auth/UnauthorizedPage';
import NotFoundPage from '@features/NotFoundPage';

// Public search — lazy, its own chunk
const PublicSearchPage = lazy(() =>
  import('@features/publicSearch/PublicSearchPage')
);

// Dashboards are lazy-loaded — each is its own bundle chunk.
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

// Antiquities feature — all pages lazy for chunk-per-route
const AntiquitiesListPage = lazy(() =>
  import('@features/antiquities/AntiquitiesListPage')
);
const AntiquityCreatePage = lazy(() =>
  import('@features/antiquities/AntiquityCreatePage')
);
const AntiquityEditPage = lazy(() =>
  import('@features/antiquities/AntiquityEditPage')
);
const AntiquityDetailPage = lazy(() =>
  import('@features/antiquities/AntiquityDetailPage')
);

// BHS feature — same lazy pattern
const BHSListPage = lazy(() => import('@features/bhs/BHSListPage'));
const BHSCreatePage = lazy(() => import('@features/bhs/BHSCreatePage'));
const BHSEditPage = lazy(() => import('@features/bhs/BHSEditPage'));
const BHSDetailPage = lazy(() => import('@features/bhs/BHSDetailPage'));

// Reports feature
const ReportsPage = lazy(() => import('@features/reports/ReportsPage'));

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
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Public search — no auth required, distinct shell */}
        <Route element={<PublicShell />}>
          <Route
            path="/search"
            element={<LazyBoundary><PublicSearchPage /></LazyBoundary>}
          />
        </Route>

        {/* --- Authenticated --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>

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

            {/* Antiquities — universal routes, data scoped server-side by role */}
            <Route
              path="/records/antiquities"
              element={<LazyBoundary><AntiquitiesListPage /></LazyBoundary>}
            />
            <Route
              path="/records/antiquities/new"
              element={<LazyBoundary><AntiquityCreatePage /></LazyBoundary>}
            />
            {/* Detail must come after /new so /new doesn't match :id */}
            <Route
              path="/records/antiquities/:id"
              element={<LazyBoundary><AntiquityDetailPage /></LazyBoundary>}
            />
            <Route
              path="/records/antiquities/:id/edit"
              element={<LazyBoundary><AntiquityEditPage /></LazyBoundary>}
            />

            {/* BHS — same URL pattern, same guard shape */}
            <Route
              path="/records/bhs"
              element={<LazyBoundary><BHSListPage /></LazyBoundary>}
            />
            <Route
              path="/records/bhs/new"
              element={<LazyBoundary><BHSCreatePage /></LazyBoundary>}
            />
            <Route
              path="/records/bhs/:id"
              element={<LazyBoundary><BHSDetailPage /></LazyBoundary>}
            />
            <Route
              path="/records/bhs/:id/edit"
              element={<LazyBoundary><BHSEditPage /></LazyBoundary>}
            />

            {/* Reports — Chunk A: Admin + Super Admin only */}
            <Route
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN]} />
              }
            >
              <Route
                path="/reports/antiquities"
                element={<LazyBoundary><ReportsPage /></LazyBoundary>}
              />
            </Route>
          </Route>
        </Route>

        {/* --- 404 --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
