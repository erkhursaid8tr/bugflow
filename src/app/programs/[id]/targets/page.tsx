'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Target as TargetIcon } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { statusLabel } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface Target {
  id: string;
  name: string;
  url: string;
  type: string;
  priority: string;
  status: string;
  notes: string;
}

const TYPES = ['WEB', 'API', 'MOBILE', 'CLOUD', 'OTHER'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW', 'SKIP'];
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'INTERESTING', 'DONE', 'SKIPPED'];

const emptyForm = { name: '', url: '', type: 'WEB', priority: 'MEDIUM', status: 'NOT_STARTED', notes: '' };

export default function TargetsPage() {
  const { id: programId } = useParams<{ id: string }>();
  const [targets, setTargets] = useState<Target[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/targets?programId=${programId}`)
      .then((r) => r.json())
      .then(setTargets)
      .finally(() => setLoading(false));
  }, [programId]);

  async function addTarget() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId }),
      });
      const t = await res.json();
      setTargets((prev) => [t, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(targetId: string, status: string) {
    await fetch(`/api/targets/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTargets((prev) => prev.map((t) => (t.id === targetId ? { ...t, status } : t)));
  }

  async function deleteTarget(targetId: string) {
    await fetch(`/api/targets/${targetId}`, { method: 'DELETE' });
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Targets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{targets.length} targets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
        >
          <Plus size={15} /> Add Target
        </button>
      </div>

      {/* Add target form */}
      {showForm && (
        <div className="mb-5 rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Target</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input style={inputStyle} placeholder="Target name (e.g. api.example.com)"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input style={inputStyle} placeholder="URL or domain"
              value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2}
            placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={addTarget} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : targets.length === 0 ? (
        <EmptyState title="No targets yet" description="Add targets to track what you're testing."
          icon={<TargetIcon size={40} />}
          action={<button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <Plus size={14} /> Add Target
          </button>} />
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Name', 'URL', 'Type', 'Priority', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {targets.map((t) => (
                <tr key={t.id} style={{ background: 'var(--bg-card)' }}
                  className="hover:opacity-90 transition-opacity">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                  <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.url || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.priority} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteTarget(t.id)} className="hover:opacity-80">
                      <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
