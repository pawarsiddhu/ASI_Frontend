import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import Button from '@components/Button';
import Card from '@components/Card';
import EmptyState from '@components/EmptyState';
import { useAuth } from '@hooks/useAuth';
import { ROLE_LABELS, ROLE_HOME_ROUTE } from '@utils/constants';
import styles from './UnauthorizedPage.module.css';

export default function UnauthorizedPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const home = role ? ROLE_HOME_ROUTE[role] : '/login';

  return (
    <div className={styles.page}>
      <Card variant="elevated" className={styles.card}>
        <EmptyState
          icon={<ShieldOff size={40} />}
          title="Access denied"
          description={
            user
              ? `You're signed in as ${user.name} (${ROLE_LABELS[role] || role}), but this page requires a different role.`
              : "You don't have permission to access this page."
          }
          action={
            <div className={styles.actions}>
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft size={14} />}
                onClick={() => navigate(-1)}
              >
                Go back
              </Button>
              <Link to={home}>
                <Button>Go to dashboard</Button>
              </Link>
            </div>
          }
        />
      </Card>
    </div>
  );
}
