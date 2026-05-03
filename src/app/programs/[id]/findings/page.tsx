'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Sparkles, Bug, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { severityColor, statusLabel } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface Finding {
  id: string;
  title: string;
  vulnerabilityType: string;
  endpoint: string;
  severity: string;
  status: string;
  description: string;
  aiValidation: string;
}

const VULN_TYPES = [
  'IDOR / BOLA', 'Broken Access Control', 'Authentication Issue', 'Authorization Issue',
  'Business Logic', 'API Security Issue', 'Excessive Data Exposure', 'Mass Assignment',
  'File Upload Issue', 'XSS', 'Open Redirect', 'SSRF', 'SQL Injection', 'CORS Misconfiguration',
  'Security Misconfiguration', 'Sensitive Information Disclosure', 'Session Management',
  'Rate Limit Issue', 'Other',
];

const SEVERITIES = ['INFORMATIONAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = [
  'IDEA', 'TESTING', 'INTERESTING', 'NEEDS_MORE_EVIDENCE', 'CONFIRMED',
  'REPORT_DRAFTED', 'REPORTED', 'DUPLICATE', 'INFORMATIVE', 'REJECTED', 'FIXED', 'PAID',
];

const emptyForm = {
  title: '', vulnerabilityType: 'Other', endpoint: '',
  severity: 'MEDIUM', status: 'IDEA', description: '',
  stepsTested: '', evidenceSummary: '', impact: '',
};

export default function FindingsPage() {
  const { id: programId } = useParams<{ id: string }>();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch(`/api/findings?programId=${programId}`)
      .then((r) => r.json())
      .then(setFindings)
      .finally(() => setLoading(false));
  }, [programId]);

  async function addFinding() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId }),
      });
      const f = await res.json();
      setFindings((prev) => [f, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function validateWithAI(findingId: string) {
    setValidating(findingId);
    try {
      const res = await fetch('/api/ai/finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId }),
      });
      const data = await res.json();
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? { ...f, aiValidation: JSON.stringify(data.aiValidation, null, 2) } : f))
      );
    } finally {
      setValidating(null);
    }
  }

  async function updateStatus(findingId: string, status: string) {
    await fetch(`/api/findings/${findingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setFindings((prev) => prev.map((f) => (f.id === findingId ? { ...f, status } : f)));
  }

  async function deleteFinding(findingId: string) {
    if (!window.confirm('Are you sure you want to delete this finding?')) return;
    await fetch(`/api/findings/${findingId}`, { method: 'DELETE' });
    setFindings((prev) => prev.filter((f) => f.id !== findingId));
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
  };

  // Group findings by status for kanban-style display
  const byStatus: Record<string, Finding[]> = {};
  for (const f of findings) {
    if (!byStatus[f.status]) byStatus[f.status] = [];
    byStatus[f.status].push(f);
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Findings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{findings.length} findings</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
          <Plus size={15} /> New Finding
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Finding</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input style={inputStyle} placeholder="Finding title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input style={inputStyle} placeholder="Endpoint or URL" value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
            <select style={inputStyle} value={form.vulnerabilityType}
              onChange={(e) => setForm({ ...form, vulnerabilityType: e.target.value })}>
              {VULN_TYPES.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select style={inputStyle} value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
            placeholder="Description of the finding..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
            placeholder="Steps tested so far..." value={form.stepsTested}
            onChange={(e) => setForm({ ...form, stepsTested: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={addFinding} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Finding
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
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : findings.length === 0 ? (
        <EmptyState title="No findings yet"
          description="Track potential bugs, confirmed vulnerabilities, and rejected items."
          icon={<Bug size={40} />}
          action={<button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <Plus size={14} /> New Finding
          </button>} />
      ) : (
        <div className="space-y-3">
          {findings.map((f) => (
            <div key={f.id} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <button className="w-full text-left px-5 py-4 flex items-center gap-4"
                onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                <div className={`shrink-0 h-2 w-2 rounded-full ${severityColor(f.severity)}`}
                  style={{ minWidth: '8px' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {f.vulnerabilityType} · {f.endpoint || 'No endpoint'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={f.severity} size="sm" />
                  <select value={f.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStatus(f.id, e.target.value)}
                    className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                  <button onClick={(e) => { e.stopPropagation(); deleteFinding(f.id); }} className="hover:opacity-80 p-1">
                    <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </button>

              {expanded === f.id && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  {f.description && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Description</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => validateWithAI(f.id)} disabled={validating === f.id}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                      {validating === f.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {validating === f.id ? 'Analyzing…' : 'Validate with AI'}
                    </button>
                  </div>
                  {f.aiValidation && (
                    <div className="rounded-lg p-4"
                      style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>AI Validation</p>
                      <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{f.aiValidation}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
