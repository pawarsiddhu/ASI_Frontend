import { Bell, Menu } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import UserMenu from './UserMenu';
import styles from './Header.module.css';

/**
 * Header — top bar.
 *
 * Left: hamburger (mobile only) + breadcrumbs
 * Right: notifications bell (stub) + user menu
 */
export default function Header({ isMobile, onOpenMobileSidebar }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {isMobile && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <Breadcrumbs />
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Notifications (coming soon)"
          title="Notifications — coming in Phase 5"
          disabled
        >
          <Bell size={16} />
          <span className={styles.notifDot} aria-hidden="true" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
