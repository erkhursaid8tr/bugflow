'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Mail, User, ShieldCheck } from 'lucide-react';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    if (tab === 'register' && !name) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tab,
          name: tab === 'register' ? name : undefined,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-2xl h-14 w-14 mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            BugFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Your AI Bug Bounty Companion
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-3.5 text-sm font-medium transition-all relative"
                style={{
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: tab === t ? 'transparent' : 'transparent',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
                {tab === t && (
                  <div
                    className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0ea5e9, #7c3aed)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                    style={inputStyle}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                  style={inputStyle}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                  style={inputStyle}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {tab === 'register' && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-2.5 text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password || (tab === 'register' && !name)}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : tab === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          {tab === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setTab('register'); setError(''); }}
                className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setTab('login'); setError(''); }}
                className="font-medium hover:opacity-80" style={{ color: 'var(--accent)' }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
