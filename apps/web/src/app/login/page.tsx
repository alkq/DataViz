'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Input, Card, LoadingSpinner } from '@/components/ui/common';

function getRedirect(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const p = new URLSearchParams(window.location.search).get('redirect');
  return p || '/dashboard';
}

function LoginContent() {
  const login = useAuthStore((state) => state.login);

  const showDevOptions = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('DEBUG handleSubmit START api=' + API_URL);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      alert('DEBUG after login fetch: ok=' + response.ok + ' hasToken=' + !!data.accessToken + ' api=' + API_URL);

      if (!response.ok) {
        throw new Error(data?.message || 'Invalid email or password');
      }

      if (data.accessToken) {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to retrieve user profile');
        }

        const user = await userResponse.json();
        login(data.accessToken, user);
        // Full-page navigation avoids App Router router.push quirks after async auth.
        window.location.href = getRedirect();
      } else {
        setError('No access token received');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/dev-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => ({}));
      if (data.accessToken) {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        const user = await userResponse.json();
        login(data.accessToken, user);
        window.location.href = '/dashboard';
      } else {
        setError(data?.error || 'Failed to generate dev token');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Dev login not available');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">DataViz Platform</h1>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            required
          />

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="text-sm text-blue-600 hover:underline focus:outline-none"
          >
            Create Account
          </Link>
        </div>

        {showDevOptions && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Development Only</p>
            <Button onClick={handleDevLogin} variant="secondary" disabled={loading} className="w-full">
              Generate Dev Token
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}
