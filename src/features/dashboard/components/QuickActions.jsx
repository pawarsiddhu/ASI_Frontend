import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Card from '@components/Card';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';
import styles from './QuickActions.module.css';

/**
 * QuickActions — role-specific action tiles.
 *
 * If `to` is provided, the tile navigates there. Otherwise it shows a toast
 * explaining which phase will build the destination (`phase` prop).
 *
 * @param {object} props
 * @param {string} props.title
 * @param {Array<{ label, description, icon, phase?, to?, iconColor? }>} props.actions
 */
export default function QuickActions({ title = 'Quick Actions', actions = [] }) {
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <div className={styles.grid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              className={styles.tile}
              onClick={() => {
                if (action.to) {
                  navigate(action.to);
                } else {
                  toast.info(
                    `${action.label} — coming in ${action.phase || 'a later phase'}`
                  );
                }
              }}
            >
              <div className={styles.iconWrap} data-color={action.iconColor || 'brand'}>
                {Icon && <Icon size={18} />}
              </div>
              <div className={styles.body}>
                <div className={styles.tileTitle}>
                  <span>{action.label}</span>
                  {!action.to && action.phase && (
                    <Badge size="sm">Soon</Badge>
                  )}
                </div>
                <div className={styles.tileDesc}>{action.description}</div>
              </div>
              <ArrowRight size={14} className={styles.arrow} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
