import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, Info, ChevronDown } from 'lucide-react';

import Button from '@components/Button';
import Input from '@components/Input';
import { useToast } from '@components/Toast';
import { MonumentSkyline, HeritageMotif, ASIMark } from '@components/HeritageArt';

import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import { useAuth } from '@hooks/useAuth';
import { ROLES, ROLE_LABELS, ROLE_HOME_ROUTE } from '@utils/constants';

import styles from './LoginPage.module.css';

/**
 * Test credential rows — click one to autofill the form.
 * Removed once real accounts exist.
 */
const TEST_USERS = [
  { username: 'operator1', label: ROLE_LABELS[ROLES.OPERATOR] },
  { username: 'supervisor1', label: ROLE_LABELS[ROLES.SUPERVISOR] },
  { username: 'admin1', label: ROLE_LABELS[ROLES.ADMIN] },
  { username: 'superadmin1', label: ROLE_LABELS[ROLES.SUPERADMIN] },
  { username: 'director1', label: ROLE_LABELS[ROLES.RD] },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showTestCreds, setShowTestCreds] = useState(false);
  const [errors, setErrors] = useState({});

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_HOME_ROUTE[role]} replace />;
  }

  const validate = () => {
    const next = {};
    if (!username.trim()) next.username = 'Username is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials(result));
      // Backend user shape is { id, username, role } — no `name` — so we fall
      // back to username. Mock users still have `name`, so both work.
      toast.success(`Welcome, ${result.user.name || result.user.username}`);
      const from = location.state?.from?.pathname;
      const destination = from || ROLE_HOME_ROUTE[result.user.role] || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    }
  };

  const useTestUser = (testUsername) => {
    setUsername(testUsername);
    setPassword('password123');
    setErrors({});
  };

  return (
    <div className={styles.page}>
      {/* -------- Left panel: branding -------- */}
      <aside className={styles.brandPanel}>
        {/* Decorative heritage motif — sits behind the content, corner-anchored,
            large and rotated so it reads as a watermark rather than a discrete image. */}
        <HeritageMotif className={styles.motif} size={520} opacity={0.08} />

        <div className={styles.brandInner}>
          <div className={styles.brandHead}>
            <div className={styles.logo}>
              <ASIMark size={30} />
            </div>
            <div>
              <div className={styles.brandTitle}>ASI Internal Portal</div>
              <div className={styles.brandSubtitle}>
                Archaeological Survey of India
              </div>
            </div>
          </div>

          <h1 className={styles.headline}>
            National Mission on Monuments and Antiquities
          </h1>
          <p className={styles.tagline}>
            Documentation and management portal for Antiquities, Built Heritage
            &amp; Sites, and Archaeological Sites across India.
          </p>

          <ul className={styles.stats}>
            <li>
              <span className={styles.statValue}>12.47L+</span>
              <span className={styles.statLabel}>Antiquities documented</span>
            </li>
            <li>
              <span className={styles.statValue}>11.4K+</span>
              <span className={styles.statLabel}>Built Heritage &amp; Sites</span>
            </li>
            <li>
              <span className={styles.statValue}>29</span>
              <span className={styles.statLabel}>ASI Circles</span>
            </li>
          </ul>

          <div className={styles.brandFoot}>
            Government of India · Ministry of Culture
          </div>
        </div>

        {/* Skyline runs edge-to-edge along the bottom of the brand panel. */}
        <MonumentSkyline className={styles.skyline} opacity={0.18} />
      </aside>

      {/* -------- Right panel: form -------- */}
      <section className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.formHead}>
            <h2 className={styles.formTitle}>Sign in to your account</h2>
            <p className={styles.formSubtitle}>
              Enter your credentials to access the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="e.g. operator1"
              leftIcon={<User size={14} />}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              error={errors.username}
              required
              size="lg"
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock size={14} />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              required
              size="lg"
            />

            <div className={styles.formRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="#" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              leftIcon={<LogIn size={14} />}
              fullWidth
              size="lg"
            >
              Sign in
            </Button>
          </form>

          {/* Test credentials — for development only */}
          <div className={styles.testCreds}>
            <button
              type="button"
              className={styles.testCredsToggle}
              onClick={() => setShowTestCreds((v) => !v)}
              aria-expanded={showTestCreds}
            >
              <Info size={12} />
              <span>Test credentials (dev only)</span>
              <ChevronDown
                size={12}
                className={`${styles.testChev} ${showTestCreds ? styles.testChevOpen : ''}`}
              />
            </button>

            {showTestCreds && (
              <div className={styles.testCredsBody}>
                <p className={styles.testCredsNote}>
                  Click any user below to autofill the form. Password for all is{' '}
                  <code>password123</code>.
                </p>
                <ul className={styles.testCredsList}>
                  {TEST_USERS.map((u) => (
                    <li key={u.username}>
                      <button
                        type="button"
                        className={styles.testCredsItem}
                        onClick={() => useTestUser(u.username)}
                      >
                        <span className={styles.testCredsRole}>{u.label}</span>
                        <code>{u.username}</code>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <p className={styles.legalFoot}>
            By signing in, you agree to abide by the ASI portal usage policies.
          </p>
        </div>
      </section>
    </div>
  );
}
