'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Save, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

interface ProgramForm {
  name: string;
  platform: string;
  programUrl: string;
  status: string;
  rawProgramText: string;
  inScope: string;
  outOfScope: string;
  allowedTesting: string;
  forbiddenTesting: string;
  rateLimits: string;
  rewardInfo: string;
  notes: string;
}

export default function EditProgramPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<ProgramForm>({
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

  useEffect(() => {
    async function fetchProgram() {
      try {
        const res = await fetch(`/api/programs/${id}`);
        if (!res.ok) throw new Error('Program not found');
        const data = await res.json();
        setForm({
          name: data.name || '',
          platform: data.platform || 'HackerOne',
          programUrl: data.programUrl || '',
          status: data.status || 'NOT_STARTED',
          rawProgramText: data.rawProgramText || '',
          inScope: data.inScope || '',
          outOfScope: data.outOfScope || '',
          allowedTesting: data.allowedTesting || '',
          forbiddenTesting: data.forbiddenTesting || '',
          rateLimits: data.rateLimits || '',
          rewardInfo: data.rewardInfo || '',
          notes: data.notes || '',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load program');
      } finally {
        setFetching(false);
      }
    }
    fetchProgram();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Program name is required.'); return; }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update program');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = `w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50`;
  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.8125rem' as const, fontWeight: 500 as const };

  if (fetching) {
    return (
      <div className="p-4 md:p-8 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Loader2 size={16} className="animate-spin" /> Loading program…
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/programs/${id}`} className="flex items-center gap-1.5 text-xs mb-2 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Back to program
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Edit Program
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Update program details, scope, and testing rules.
        </p>
      </div>

      {/* Safety reminder */}
      <div className="mb-6 flex gap-3 rounded-xl px-4 py-3.5"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--yellow)' }} />
        <p className="text-xs" style={{ color: 'var(--yellow)' }}>
          Only test programs where you have explicit authorization. Stay within the written scope.
        </p>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Program Name <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Acme Corp Bug Bounty"
              className={inputClass} style={inputStyle}
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
              name="programUrl" value={form.programUrl} onChange={handleChange}
              placeholder="https://hackerone.com/..."
              className={inputClass} style={inputStyle}
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

        {/* Raw program text */}
        <div>
          <label className="block mb-1.5" style={labelStyle}>
            Raw Program Text
            <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
              (Full program page paste)
            </span>
          </label>
          <textarea
            name="rawProgramText" value={form.rawProgramText} onChange={handleChange}
            rows={10}
            placeholder="Paste the full bug bounty program description, scope, rules, and reward table here..."
            className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle}
          />
        </div>

        {/* Scope details */}
        <div className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Scope Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5" style={labelStyle}>In-Scope Assets</label>
              <textarea name="inScope" value={form.inScope} onChange={handleChange}
                rows={4} placeholder="*.example.com&#10;api.example.com"
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
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--green)' }}>
            ✓ Program updated successfully
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving…' : 'Save Changes'}
          </button>

          <Link
            href={`/programs/${id}`}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
