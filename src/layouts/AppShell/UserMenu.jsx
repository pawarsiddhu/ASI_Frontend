import { useState } from 'react';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import Badge from '@components/Badge';
import { useAuth } from '@hooks/useAuth';
import { useClickOutside } from '@hooks/useClickOutside';
import { ROLE_LABELS, ROLE_BADGE_VARIANT } from '@utils/constants';
import styles from './UserMenu.module.css';

/**
 * UserMenu — user avatar/name button in the header that opens a dropdown
 * with role details and a Sign out action.
 */
export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const ref = useClickOutside(() => setOpen(false));

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.triggerText}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.roleText}>{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown
          size={14}
          className={`${styles.chev} ${open ? styles.chevOpen : ''}`}
        />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.header}>
            <div className={styles.headerAvatar} aria-hidden="true">
              {initials}
            </div>
            <div className={styles.headerText}>
              <div className={styles.headerName}>{user.name}</div>
              <div className={styles.headerEmail}>{user.email}</div>
              <div className={styles.headerBadge}>
                <Badge size="sm" variant={ROLE_BADGE_VARIANT[role]}>
                  {ROLE_LABELS[role]}
                </Badge>
                {user.circle && (
                  <span className={styles.circle}>{user.circle}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.item}
            role="menuitem"
            disabled
            title="Coming soon"
          >
            <UserIcon size={14} />
            <span>My profile</span>
            <span className={styles.itemBadge}>Soon</span>
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={`${styles.item} ${styles.itemDanger}`}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
