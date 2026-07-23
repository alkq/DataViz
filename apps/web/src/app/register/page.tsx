'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Input, Card, LoadingSpinner } from '@/components/ui/common';
import { Beams } from '@/components/reactbits/Beams';
import { SideRays } from '@/components/reactbits/SideRays';
import { Threads } from '@/components/reactbits/Threads';
import { DecryptedText } from '@/components/reactbits/DecryptedText';
import { SpecularButton } from '@/components/reactbits/SpecularButton';
import { BorderGlow } from '@/components/reactbits/BorderGlow';

function getRedirect(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const p = new URLSearchParams(window.location.search).get('redirect');
  return p || '/dashboard';
}

function RegisterContent() {
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Registration failed');
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
        window.location.href = getRedirect();
      } else {
        setError('No access token received');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 overflow-hidden">
      <Beams />
      <SideRays />
      <Threads color="59,130,246" />
      <BorderGlow className="relative z-10 w-full max-w-md" radius="1rem" color="rgba(59,130,246,0.7)">
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border-0">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 text-white grid place-items-center text-xl font-bold">D</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <DecryptedText text="Create your account" speed={35} />
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Start visualizing your data in minutes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
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
            placeholder="At least 6 characters"
            disabled={loading}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            required
          />
          <SpecularButton type="submit" disabled={loading} className="w-full !py-3 text-base">
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </SpecularButton>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">Already have an account? </span>
          <Link href="/login" className="text-sm text-blue-600 hover:underline focus:outline-none">
            Sign In
          </Link>
        </div>
      </Card>
      </BorderGlow>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterContent />;
}
