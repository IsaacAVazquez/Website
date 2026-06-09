'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, signOut, signIn } from 'next-auth/react';
import { IconLogout, IconLock } from '@tabler/icons-react';
import { ModernButton } from '@/components/ui/ModernButton';
import { WarmCard } from '@/components/ui/WarmCard';

const FANTASY_WORKFLOW_URL =
  'https://github.com/IsaacAVazquez/Website/actions/workflows/update-fantasy.yml';
const FOOTBALL_WORKFLOW_URL =
  'https://github.com/IsaacAVazquez/Website/actions/workflows/update-premier-league.yml';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [loginForm, setLoginForm] = useState({ username: '', password: '', error: '', isLoading: false });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (!error) return;

    const errorMessage = (() => {
      switch (error) {
        case 'CredentialsSignin':
          return 'Invalid username or password';
        case 'Configuration':
          return 'Server configuration error';
        case 'AccessDenied':
          return 'Access denied';
        case 'Verification':
          return 'Verification failed';
        default:
          return `Authentication error: ${error}`;
      }
    })();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-shot mount-time read of URL search params; safe to surface auth error after first paint
    setLoginForm(prev => ({ ...prev, error: errorMessage }));
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginForm(prev => ({ ...prev, error: '', isLoading: true }));
    try {
      const result = await signIn('credentials', {
        username: loginForm.username,
        password: loginForm.password,
        redirect: false,
      });
      if (result?.error) {
        setLoginForm(prev => ({ ...prev, error: 'Invalid credentials', isLoading: false }));
      } else {
        setLoginForm(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      setLoginForm(prev => ({ ...prev, error: 'An error occurred. Please try again.', isLoading: false }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="home-page min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--home-ink-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="home-page min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <WarmCard hover={false} padding="xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--home-haze)_14%,transparent)] mb-4">
                <IconLock className="w-8 h-8 text-[var(--home-haze)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--home-haze)] mb-2">
                Admin Access
              </h1>
              <p className="text-[var(--home-ink-muted)]">Portfolio Dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[var(--home-ink)] mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--home-paper)] border-2 border-[var(--home-rule)] rounded-lg text-[var(--home-ink)] placeholder-[var(--home-ink-muted)] focus:outline-none focus:border-[var(--home-haze)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-haze)_24%,transparent)] transition-colors"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--home-ink)] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--home-paper)] border-2 border-[var(--home-rule)] rounded-lg text-[var(--home-ink)] placeholder-[var(--home-ink-muted)] focus:outline-none focus:border-[var(--home-haze)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-haze)_24%,transparent)] transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>

              {loginForm.error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">{loginForm.error}</p>
                </div>
              )}

              <ModernButton type="submit" variant="primary" size="lg" fullWidth disabled={loginForm.isLoading}>
                {loginForm.isLoading ? 'Signing in...' : 'Sign In'}
              </ModernButton>
            </form>
          </WarmCard>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-shell-tight py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-6 mb-10"
        >
          <div>
            <p className="home-kicker mb-2">Admin Dashboard</p>
            <h1 className="text-3xl font-semibold" style={{ letterSpacing: '-0.02em' }}>
              Signed in
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--home-ink-muted)' }}>
              Welcome back. Data refreshes run from GitHub Actions on a schedule. Trigger them manually below if needed.
            </p>
          </div>
          <ModernButton onClick={() => signOut({ callbackUrl: '/' })} variant="secondary" size="sm">
            <IconLogout className="w-4 h-4" />
            Sign Out
          </ModernButton>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="home-card p-6">
            <p className="home-kicker mb-2">Fantasy Football</p>
            <h2 className="text-xl font-semibold mb-2">Published rankings snapshot</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--home-ink-muted)' }}>
              Rankings are built from FantasyPros public cheatsheets and committed as static JSON. Refresh runs weekly on Wednesdays; trigger manually via{' '}
              <code className="text-xs">workflow_dispatch</code>.
            </p>
            <a
              href={FANTASY_WORKFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--home-acid)' }}
            >
              Open GitHub Actions workflow →
            </a>
          </article>

          <article className="home-card p-6">
            <p className="home-kicker mb-2">Football Dashboards</p>
            <h2 className="text-xl font-semibold mb-2">Premier League & La Liga</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--home-ink-muted)' }}>
              League data refreshes on a schedule via the football-data.org API. Team-level snapshots (sidebar fixtures, form strip) require a manual local run.
            </p>
            <a
              href={FOOTBALL_WORKFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--home-acid)' }}
            >
              Open GitHub Actions workflow →
            </a>
          </article>
        </div>
      </div>
    </div>
  );
}
