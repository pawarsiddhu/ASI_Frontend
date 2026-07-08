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
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [collapsed, setCollapsed] = useLocalStorage('asi_sidebar_collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      <div className={styles.column}>
        <Header
          isMobile={isMobile}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className={styles.main} id="main-content">
          <div className={styles.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
