import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, Map } from 'lucide-react';
import styles from './PublicShell.module.css';

/**
 * PublicShell — layout for public, unauthenticated pages (/search, /explore).
 *
 * Deliberately slim: brand mark on the left, back-to-home + login on the
 * right. No sidebar, no role-aware nav. Kept as its own component so future
 * public pages (public detail view, contact us, etc.) can reuse it.
 */
export default function PublicShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand} aria-label="ASI NMMA — home">
            <span className={styles.brandMark} aria-hidden="true">A</span>
            <span className={styles.brandText}>
              <span className={styles.brandLine1}>NMMA</span>
              <span className={styles.brandLine2}>Archaeological Survey of India</span>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Public sections">
            <NavLink to="/search" className={({ isActive }) => (isActive ? styles.navOn : styles.navLink)}>
              <Search size={14} aria-hidden="true" />
              <span>Search</span>
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => (isActive ? styles.navOn : styles.navLink)}>
              <Map size={14} aria-hidden="true" />
              <span>Map</span>
            </NavLink>
          </nav>

          <div className={styles.actions}>
            <Link to="/" className={styles.back}>
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to home</span>
            </Link>
            <Link to="/login" className={styles.login}>
              <span>Login</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
