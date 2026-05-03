'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Bug } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Successful login, go back to dashboard
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <div 
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl" 
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex justify-center mb-6">
          <div 
            className="p-3 rounded-xl flex items-center justify-center shadow-inner" 
            style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56,189,248,0.2)' }}
          >
            <Bug size={32} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome to BugFlow
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
          Please enter your secure access password.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all"
                style={{ 
                  background: 'var(--bg-base)', 
                  borderColor: error ? 'var(--red)' : 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="mt-2 text-sm font-medium flex items-center" style={{ color: 'var(--red)' }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
