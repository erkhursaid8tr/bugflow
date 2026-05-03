'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Sparkles, CalendarDays, Trash2, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

interface DailyLog {
  id: string;
  programId: string | null;
  date: string;
  timeSpent: string;
  whatTested: string;
  toolsUsed: string;
  whatFound: string;
  blockers: string;
  nextSteps: string;
  notes: string;
  aiSummary: string;
  program?: { id: string; name: string } | null;
}

interface Program {
  id: string;
  name: string;
}

export default function GlobalLogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [form, setForm] = useState({
    programId: '', date: new Date().toISOString().split('T')[0],
    timeSpent: '', whatTested: '', toolsUsed: '', whatFound: '',
    blockers: '', nextSteps: '', notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/daily-logs').then((r) => r.json()),
      fetch('/api/programs').then((r) => r.json()),
    ]).then(([l, p]) => {
      setLogs(l);
      setPrograms(p);
    }).finally(() => setLoading(false));
  }, []);

  async function addLog() {
    if (!form.whatTested.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId: form.programId || null }),
      });
      const log = await res.json();
      setLogs((prev) => [log, ...prev]);
      setForm({ ...form, whatTested: '', toolsUsed: '', whatFound: '', blockers: '', nextSteps: '', notes: '', timeSpent: '' });
      setShowForm(false);
      setExpanded(log.id);
    } finally {
      setSaving(false);
    }
  }

  async function summarizeLog(logId: string) {
    setSummarizing(logId);
    try {
      const res = await fetch(`/api/daily-logs/${logId}`, { method: 'POST' });
      const data = await res.json();
      if (data.aiSummary) {
        setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, aiSummary: data.aiSummary } : l)));
      }
    } finally {
      setSummarizing(null);
    }
  }

  async function deleteLog(logId: string) {
    await fetch(`/api/daily-logs/${logId}`, { method: 'DELETE' });
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
  };
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 as const, display: 'block' as const, marginBottom: '0.375rem' };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <CalendarDays size={22} /> Daily Logs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Record what you tested, found, and plan next
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
          <Plus size={15} /> New Log Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Log Today&apos;s Work</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Time Spent</label>
              <input style={inputStyle} placeholder="e.g. 2 hours" value={form.timeSpent}
                onChange={(e) => setForm({ ...form, timeSpent: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Program</label>
              <select style={inputStyle} value={form.programId}
                onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                <option value="">General (no program)</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>What I Tested <span style={{ color: '#f87171' }}>*</span></label>
            <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3}
              placeholder="What areas, endpoints, or features did you test?"
              value={form.whatTested} onChange={(e) => setForm({ ...form, whatTested: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label style={labelStyle}>Tools Used</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2}
                placeholder="Burp Suite, browser DevTools, httpx..."
                value={form.toolsUsed} onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>What I Found</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2}
                placeholder="Interesting behaviors, possible bugs, nothing notable..."
                value={form.whatFound} onChange={(e) => setForm({ ...form, whatFound: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Blockers</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2}
                placeholder="Rate limits, WAF, unclear scope..."
                value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Next Steps</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2}
                placeholder="What to test next session..."
                value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Additional Notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2}
              placeholder="Anything else worth remembering..."
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={addLog} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save Log
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2.5 text-sm"
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
      ) : logs.length === 0 ? (
        <EmptyState title="No daily logs yet"
          description="Start tracking your testing sessions to build a record of your work."
          icon={<CalendarDays size={48} />}
          action={<button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <Plus size={14} /> New Log Entry
          </button>} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isOpen = expanded === log.id;
            return (
              <div key={log.id} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : log.id)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(log.date)}
                      </span>
                      {log.timeSpent && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {log.timeSpent}</span>
                      )}
                      {log.program && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.2)' }}>
                          {log.program.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {log.whatTested}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }}
                      className="hover:opacity-80 p-1 transition-opacity">
                      <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="p-5 space-y-4">
                    {log.whatTested && <Field label="What I Tested" value={log.whatTested} />}
                    {log.toolsUsed && <Field label="Tools Used" value={log.toolsUsed} />}
                    {log.whatFound && <Field label="What I Found" value={log.whatFound} />}
                    {log.blockers && <Field label="Blockers" value={log.blockers} />}
                    {log.nextSteps && <Field label="Next Steps" value={log.nextSteps} />}
                    {log.notes && <Field label="Notes" value={log.notes} />}

                    {/* AI Summary */}
                    {log.aiSummary && (
                      <div className="rounded-lg p-4"
                        style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>AI Summary</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {log.aiSummary}
                        </p>
                      </div>
                    )}

                    <button onClick={() => summarizeLog(log.id)} disabled={summarizing === log.id}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                      {summarizing === log.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {summarizing === log.id ? 'Summarizing…' : log.aiSummary ? 'Re-summarize with AI' : 'Summarize with AI'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{value}</p>
    </div>
  );
}
