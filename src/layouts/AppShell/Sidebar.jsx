import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import Badge from '@components/Badge';
import { useAuth } from '@hooks/useAuth';
import { getNavigationForRole } from './navigation';
import { ROLE_LABELS } from '@utils/constants';
import styles from './Sidebar.module.css';

/**
 * Sidebar — left nav.
 *
 * Desktop: always visible. Toggles between 240px (full) and 64px (icon-only).
 * Mobile: hidden by default. Slides in as an overlay drawer when `mobileOpen`.
 */
export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  isMobile,
}) {
  const { role } = useAuth();
  const items = getNavigationForRole(role);

  const classes = [
    styles.sidebar,
    collapsed && !isMobile ? styles.collapsed : '',
    isMobile ? styles.mobile : '',
    isMobile && mobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={classes} aria-label="Primary navigation">
        <div className={styles.brand}>
          <div className={styles.logo}>A</div>
          {!collapsed && (
            <div className={styles.brandText}>
              <div className={styles.brandTitle}>ASI Portal</div>
              <div className={styles.brandSubtitle}>NMMA</div>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {!collapsed && (
            <div className={styles.sectionLabel}>{ROLE_LABELS[role]}</div>
          )}
          <ul>
            {items.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                collapsed={collapsed && !isMobile}
                onClick={isMobile ? onCloseMobile : undefined}
              />
            ))}
          </ul>
        </nav>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </aside>
    </>
  );
}

function NavItem({ item, collapsed, onClick }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className={styles.itemIcon} aria-hidden="true">
        {Icon && <Icon size={16} />}
      </span>
      {!collapsed && (
        <>
          <span className={styles.itemLabel}>{item.label}</span>
          {item.badge && (
            <Badge size="sm" variant="default">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </>
  );

  if (item.disabled) {
    return (
      <li>
        <span
          className={`${styles.item} ${styles.itemDisabled}`}
          title={collapsed ? `${item.label} (coming soon)` : undefined}
          aria-disabled="true"
        >
          {content}
        </span>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end
        onClick={onClick}
        className={({ isActive }) =>
          [styles.item, isActive ? styles.itemActive : ''].filter(Boolean).join(' ')
        }
        title={collapsed ? item.label : undefined}
      >
        {content}
      </NavLink>
    </li>
  );
}
