import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { ROLE_LABELS, ROLE_HOME_ROUTE } from '@utils/constants';
import styles from './Breadcrumbs.module.css';

/**
 * Breadcrumbs — path-driven trail.
 * For now (Phase 4), most routes are single-level so it renders:
 *   Home > <role> > Dashboard
 * Feature routes added later (records/antiquities, records/detail/:id)
 * can plug into the same segment logic below.
 */

// Human-friendly labels for known path segments.
const SEGMENT_LABEL = {
  operator: 'Operator',
  supervisor: 'Supervisor',
  admin: 'Admin',
  superadmin: 'Super Admin',
  rd: 'Regional Director',
  antiquities: 'Antiquities',
  bhs: 'Built Heritage',
  sites: 'Sites',
  records: 'Records',
  reports: 'Reports',
  cpanel: 'C-Panel',
  cms: 'CMS',
  users: 'Users',
  new: 'New',
};

function labelize(segment) {
  return SEGMENT_LABEL[segment] || segment.replace(/-/g, ' ');
}

export default function Breadcrumbs() {
  const location = useLocation();
  const { role } = useAuth();
  const home = role ? ROLE_HOME_ROUTE[role] : '/';

  const segments = location.pathname.split('/').filter(Boolean);

  // On the dashboard itself, we render just "Home / Role Dashboard".
  const isOnDashboard =
    segments.length === 1 && segments[0] === role;

  return (
    <nav aria-label="Breadcrumb" className={styles.crumbs}>
      <Link to={home} className={styles.crumb}>
        <Home size={12} />
        <span>Home</span>
      </Link>
      {isOnDashboard ? (
        <>
          <ChevronRight size={12} className={styles.sep} />
          <span className={styles.current}>
            {ROLE_LABELS[role]} Dashboard
          </span>
        </>
      ) : (
        segments.map((seg, idx) => {
          const path = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;
          return (
            <span key={path} style={{ display: 'contents' }}>
              <ChevronRight size={12} className={styles.sep} />
              {isLast ? (
                <span className={styles.current}>{labelize(seg)}</span>
              ) : (
                <Link to={path} className={styles.crumb}>
                  {labelize(seg)}
                </Link>
              )}
            </span>
          );
        })
      )}
    </nav>
  );
}
