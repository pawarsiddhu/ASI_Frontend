import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { useLocalStorage } from '@hooks/useLocalStorage';
import styles from './AppShell.module.css';

/**
 * AppShell — the authenticated layout.
 *
 * Desktop: sidebar sticky-left, header sticky-top, main content in the corner.
 * Mobile: sidebar becomes a slide-in drawer triggered from a hamburger button
 *         in the header. Closes on backdrop click or route change.
 *
 * The desktop "collapsed" preference persists to localStorage so users don't
 * have to re-collapse every session.
 */
export default function AppShell() {
  // Drawer engages at 1023px (was 767px) so tablets and small laptops don't
  // get the 248px sidebar wedged next to a shrinking content area.
  const isMobile = useMediaQuery('(max-width: 1023px)');
  // Between 1024–1279px the sidebar auto-collapses to icons-only by default;
  // user can expand from the collapse toggle and their choice persists.
  const isNarrowDesktop = useMediaQuery('(max-width: 1279px)');
  const [collapsed, setCollapsed] = useLocalStorage(
    'asi_sidebar_collapsed',
    isNarrowDesktop
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.shell} data-print-root>
      <div data-print-hide style={{ display: 'contents' }}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          isMobile={isMobile}
        />
      </div>

      <div className={styles.column}>
        <div data-print-hide style={{ display: 'contents' }}>
          <Header
            isMobile={isMobile}
            onOpenMobileSidebar={() => setMobileOpen(true)}
          />
        </div>
        <main className={styles.main} id="main-content">
          <div className={styles.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
