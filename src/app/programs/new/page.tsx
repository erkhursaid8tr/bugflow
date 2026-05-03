'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Save, AlertTriangle } from 'lucide-react';

const PLATFORMS = [
  'HackerOne', 'Bugcrowd', 'Intigriti', 'YesWeHack',
  'Synack', 'Cobalt', 'Private Program', 'Other',
];

const STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    platform: 'HackerOne',
    programUrl: '',
    status: 'NOT_STARTED',
    rawProgramText: '',
    inScope: '',
    outOfScope: '',
    allowedTesting: '',
    forbiddenTesting: '',
    rateLimits: '',
    rewardInfo: '',
    notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function createProgram(): Promise<string> {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to create program');
    const data = await res.json();
    return data.id as string;
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Program name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const id = await createProgram();
      router.push(`/programs/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAndGenerate() {
    if (!form.name.trim()) { setError('Program name is required.'); return; }
    setGenerating(true);
    setError('');
    try {
      const id = await createProgram();
      // Trigger roadmap generation in the background
      const genRes = await fetch(`/api/programs/${id}/generate-roadmap`, { method: 'POST' });
      if (!genRes.ok) {
        const data = await genRes.json();
        setError(`Saved program but AI generation failed: ${data.details ?? data.error}`);
      }
      router.push(`/programs/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  const inputClass = `w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50`;
  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Add Program
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Paste the full program details. The AI will generate a scope summary and testing roadmap.
        </p>
      </div>

      {/* Safety reminder */}
      <div className="mb-6 flex gap-3 rounded-xl px-4 py-3.5"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
        <p className="text-xs" style={{ color: '#fbbf24' }}>
          Only add programs where you have explicit authorization to test. Never add targets outside the written scope.
        </p>
      </div>

      <div className="space-y-5">
        {/* Basic info row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Program Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp Bug Bounty"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block mb-1.5" style={labelStyle}>Platform</label>
            <select name="platform" value={form.platform} onChange={handleChange}
              className={inputClass} style={inputStyle}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1.5" style={labelStyle}>Program URL</label>
            <input
              name="programUrl"
              value={form.programUrl}
              onChange={handleChange}
              placeholder="https://hackerone.com/..."
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block mb-1.5" style={labelStyle}>Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className={inputClass} style={inputStyle}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Raw program text — most important field */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>
            Raw Program Text
            <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
              (Paste the full program page here)
            </span>
          </label>
          <textarea
            name="rawProgramText"
            value={form.rawProgramText}
            onChange={handleChange}
            rows={10}
            placeholder="Paste the full bug bounty program description, scope, rules, and reward table here..."
            className={`${inputClass} resize-y font-mono text-xs`}
            style={inputStyle}
          />
        </div>

        {/* Scope fields */}
        <div className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Scope Details
            <span className="ml-2 font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
              (Optional — AI will parse from raw text if left blank)
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5" style={labelStyle}>In-Scope Assets</label>
              <textarea name="inScope" value={form.inScope} onChange={handleChange}
                rows={4} placeholder="*.example.com&#10;api.example.com&#10;app.example.com"
                className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Out-of-Scope Assets</label>
              <textarea name="outOfScope" value={form.outOfScope} onChange={handleChange}
                rows={4} placeholder="admin.example.com&#10;staging.example.com"
                className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Allowed Testing</label>
              <textarea name="allowedTesting" value={form.allowedTesting} onChange={handleChange}
                rows={3} placeholder="Manual testing, authenticated testing, API testing..."
                className={`${inputClass} resize-y`} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Forbidden Testing</label>
              <textarea name="forbiddenTesting" value={form.forbiddenTesting} onChange={handleChange}
                rows={3} placeholder="No automated scanning, no DoS, no phishing..."
                className={`${inputClass} resize-y`} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Rate Limits</label>
              <textarea name="rateLimits" value={form.rateLimits} onChange={handleChange}
                rows={2} placeholder="Max 100 requests/min, etc."
                className={`${inputClass} resize-y`} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Reward Information</label>
              <textarea name="rewardInfo" value={form.rewardInfo} onChange={handleChange}
                rows={2} placeholder="$100-$10,000 depending on severity..."
                className={`${inputClass} resize-y`} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              rows={3} placeholder="Personal notes, reminders, special considerations..."
              className={`${inputClass} resize-y`} style={inputStyle} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={loading || generating}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Program
          </button>

          <button
            onClick={handleSaveAndGenerate}
            disabled={loading || generating}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {generating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {generating ? 'Generating roadmap…' : 'Save & Generate AI Roadmap'}
          </button>
        </div>

        {generating && (
          <div className="rounded-xl px-5 py-4"
            style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              🤖 Ollama is generating your roadmap…
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              This may take 30–120 seconds depending on your model. The program is saved — you can navigate away and come back.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
