'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { Lock, LogOut } from "lucide-react";
import { ModernButton } from '@/components/ui/ModernButton';
import { LocalDataBackupCard } from '@/components/admin/LocalDataBackupCard';

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
      <section className="c97-band" data-c97-surface="paper" aria-label="Loading">
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="sr-only">Admin</h1>
          <p className="c97-prose" style={{ color: 'var(--c97-ink-2)' }}>Loading...</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="c97-band" data-c97-surface="paper" aria-label="Admin sign in">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full" style={{ maxWidth: '28rem' }}>
            <div className="c97-panel">
              <div className="text-center" style={{ marginBottom: 'var(--c97-sp-4)' }}>
                <div
                  className="inline-flex items-center justify-center w-16 h-16 bg-[color-mix(in_srgb,var(--c97-accent)_14%,transparent)]"
                  style={{ marginBottom: 'var(--c97-sp-2)' }}
                >
                  <Lock className="w-8 h-8" style={{ color: 'var(--c97-accent)' }} />
                </div>
                <h1 className="c97-serif c97-h2" style={{ color: 'var(--c97-accent)' }}>
                  Admin Access
                </h1>
                <p className="c97-prose" style={{ marginTop: 'var(--c97-sp-1)', color: 'var(--c97-ink-2)' }}>
                  Portfolio Dashboard
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 'var(--c97-sp-3)' }}>
                  <label
                    htmlFor="username"
                    className="c97-kicker"
                    style={{ display: 'block', marginBottom: 'var(--c97-sp-1)' }}
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="c97-field"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div style={{ marginBottom: 'var(--c97-sp-3)' }}>
                  <label
                    htmlFor="password"
                    className="c97-kicker"
                    style={{ display: 'block', marginBottom: 'var(--c97-sp-1)' }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="c97-field"
                    placeholder="Enter password"
                    required
                  />
                </div>

                {loginForm.error && (
                  <p role="alert" className="c97-prose" style={{ color: 'var(--c97-negative)', marginBottom: 'var(--c97-sp-3)' }}>
                    {loginForm.error}
                  </p>
                )}

                <ModernButton type="submit" variant="primary" size="lg" fullWidth disabled={loginForm.isLoading}>
                  {loginForm.isLoading ? 'Signing in...' : 'Sign In'}
                </ModernButton>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="c97-band" data-c97-surface="paper" aria-label="Admin dashboard">
      <div className="c97-shell">
        <div
          className="flex items-start justify-between gap-6"
          style={{ marginBottom: 'var(--c97-sp-5)' }}
        >
          <div>
            <p className="c97-kicker">Admin Dashboard</p>
            <h1 className="c97-serif c97-h2" style={{ marginTop: 'var(--c97-sp-1)' }}>
              Signed in
            </h1>
            <p className="c97-prose" style={{ marginTop: 'var(--c97-sp-1)', color: 'var(--c97-ink-2)' }}>
              Welcome back. Data refreshes run from GitHub Actions on a schedule. Trigger them manually below if needed.
            </p>
          </div>
          <ModernButton onClick={() => signOut({ callbackUrl: '/' })} variant="secondary" size="sm">
            <LogOut className="w-4 h-4" />
            Sign Out
          </ModernButton>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="c97-panel">
            <p className="c97-kicker">Fantasy Football</p>
            <h2 className="c97-serif c97-h3" style={{ marginTop: 'var(--c97-sp-1)' }}>
              Published rankings snapshot
            </h2>
            <p className="c97-prose" style={{ marginTop: 'var(--c97-sp-1)', marginBottom: 'var(--c97-sp-2)', color: 'var(--c97-ink-2)' }}>
              Rankings are built from FantasyPros public cheatsheets and committed as static JSON. Refresh runs daily during draft season and weekly outside it; trigger manually via{' '}
              <code className="text-xs">workflow_dispatch</code>.
            </p>
            <a
              href={FANTASY_WORKFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--c97-accent)' }}
            >
              Open GitHub Actions workflow →
            </a>
          </article>

          <article className="c97-panel">
            <p className="c97-kicker">Football Dashboards</p>
            <h2 className="c97-serif c97-h3" style={{ marginTop: 'var(--c97-sp-1)' }}>
              Premier League &amp; La Liga
            </h2>
            <p className="c97-prose" style={{ marginTop: 'var(--c97-sp-1)', marginBottom: 'var(--c97-sp-2)', color: 'var(--c97-ink-2)' }}>
              League data refreshes every four hours during the season via the football-data.org API. Team-level snapshots (sidebar fixtures, form strip) require a manual local run.
            </p>
            <a
              href={FOOTBALL_WORKFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: 'var(--c97-accent)' }}
            >
              Open GitHub Actions workflow →
            </a>
          </article>

          <LocalDataBackupCard />
        </div>
      </div>
    </section>
  );
}
