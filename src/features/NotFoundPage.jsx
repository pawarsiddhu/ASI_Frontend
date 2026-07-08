import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Card from '@components/Card';
import Button from '@components/Button';
import EmptyState from '@components/EmptyState';
import { useAuth } from '@hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@utils/constants';

export default function NotFoundPage() {
  const { role, isAuthenticated } = useAuth();
  const home = isAuthenticated && role ? ROLE_HOME_ROUTE[role] : '/login';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-bg-page)',
      }}
    >
      <Card variant="elevated" style={{ width: '100%', maxWidth: 520 }}>
        <EmptyState
          icon={<Compass size={40} />}
          title="Page not found"
          description="The page you were looking for doesn't exist or has been moved."
          action={
            <Link to={home}>
              <Button>Take me home</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
