'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Wifi, Database, ShieldCheck, RefreshCw } from 'lucide-react';

interface ConnectionResult {
  success: boolean;
  model: string;
  message: string;
}

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [ollamaUrl] = useState('http://localhost:11434');
  const [model] = useState('qwen2.5-coder:7b');

  async function testConnection() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/ollama/test');
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, model, message: 'Network error — is the Next.js server running?' });
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    // Auto-test on mount
    testConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  };

  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 };
  const valueStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    display: 'block',
    width: '100%',
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure your local BugFlow workspace.
        </p>
      </div>

      <div className="space-y-5">
        {/* Ollama connection */}
        <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
          <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Wifi size={16} style={{ color: 'var(--accent)' }} />
            Ollama Configuration
          </h2>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Ollama Base URL</label>
            <span style={valueStyle}>{ollamaUrl}</span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Set via <code className="rounded px-1"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>OLLAMA_BASE_URL</code> in <code
                className="rounded px-1" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>.env</code>
            </p>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Active Model</label>
            <span style={valueStyle}>{model}</span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Set via <code className="rounded px-1"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>OLLAMA_MODEL</code> in <code
                className="rounded px-1" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>.env</code>.
              Restart the dev server after changing.
            </p>
          </div>

          {/* Connection test result */}
          {result && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3"
              style={{
                background: result.success ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${result.success ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              }}
            >
              {result.success ? (
                <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#34d399' }} />
              ) : (
                <XCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: result.success ? '#34d399' : '#f87171' }}>
                  {result.success ? 'Ollama connected' : 'Cannot reach Ollama'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={cardStyle}
          >
            {testing ? (
              <Loader2 size={15} className="animate-spin" style={{ color: 'var(--accent)' }} />
            ) : (
              <RefreshCw size={15} style={{ color: 'var(--accent)' }} />
            )}
            <span style={{ color: 'var(--text-secondary)' }}>
              {testing ? 'Testing connection…' : 'Test Ollama Connection'}
            </span>
          </button>
        </div>

        {/* Database info */}
        <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
          <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Database size={16} style={{ color: '#a78bfa' }} />
            Database
          </h2>
          <div>
            <label className="block mb-1.5" style={labelStyle}>Location</label>
            <span style={valueStyle}>prisma/dev.db (SQLite — local only)</span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              All data stays on this machine. No cloud sync. No telemetry.
            </p>
          </div>
        </div>

        {/* Safety mode */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}>
            <ShieldCheck size={16} style={{ color: '#fbbf24' }} />
            Safety Mode
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="flex h-5 w-10 items-center rounded-full px-0.5"
              style={{ background: 'linear-gradient(90deg, #0ea5e9, #7c3aed)' }}
            >
              <div className="h-4 w-4 rounded-full bg-white translate-x-5 transition-transform" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Always Enabled
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                The AI system prompt enforces safe, authorized-testing-only guidance. This cannot be disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Setup instructions */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Ollama Setup
          </h2>
          <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p>If Ollama is not running, start it with:</p>
            <pre className="rounded-lg px-3 py-2.5 font-mono"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: '#34d399' }}>
              ollama serve
            </pre>
            <p>To pull the recommended model:</p>
            <pre className="rounded-lg px-3 py-2.5 font-mono"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: '#34d399' }}>
              ollama pull qwen2.5-coder:7b
            </pre>
            <p>To use a different model, update <code className="rounded px-1"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>OLLAMA_MODEL</code> in{' '}
              <code className="rounded px-1"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>.env</code> and restart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
