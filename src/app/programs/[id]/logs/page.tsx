'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Loader2, Sparkles, CalendarDays, Trash2, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

interface DailyLog {
  id: string;
  date: string;
  timeSpent: string;
  whatTested: string;
  toolsUsed: string;
  whatFound: string;
  blockers: string;
  nextSteps: string;
  notes: string;
  aiSummary: string;
}

export default function ProgramLogsPage() {
  const { id: programId } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSpent: '', whatTested: '', toolsUsed: '', whatFound: '',
    blockers: '', nextSteps: '', notes: '',
  });

  useEffect(() => {
    fetch(`/api/daily-logs?programId=${programId}`)
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [programId]);

  async function addLog() {
    if (!form.whatTested.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId }),
      });
      const log = await res.json();
      setLogs((prev) => [log, ...prev]);
      setForm({ ...form, whatTested: '', toolsUsed: '', whatFound: '', blockers: '', nextSteps: '', notes: '', timeSpent: '' });
      setShowForm(false);
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
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    await fetch(`/api/daily-logs/${logId}`, { method: 'DELETE' });
    setLogs((prev) => prev.filter((l) => l.id !== logId));
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

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/programs/${programId}`} className="text-xs hover:opacity-80 mb-1 block"
            style={{ color: 'var(--text-muted)' }}>← Program Overview</Link>
          <h1 className="flex items-center gap-2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <CalendarDays size={20} /> Daily Logs
          </h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
          <Plus size={15} /> New Log
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="date" style={inputStyle} value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input style={inputStyle} placeholder="Time spent (e.g. 2 hours)"
              value={form.timeSpent} onChange={(e) => setForm({ ...form, timeSpent: e.target.value })} />
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3} placeholder="What did you test?"
            value={form.whatTested} onChange={(e) => setForm({ ...form, whatTested: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2} placeholder="Tools used"
              value={form.toolsUsed} onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })} />
            <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2} placeholder="What you found"
              value={form.whatFound} onChange={(e) => setForm({ ...form, whatFound: e.target.value })} />
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={2} placeholder="Next steps"
            value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={addLog} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No logs for this program" description="Start tracking your sessions." icon={<CalendarDays size={40} />}
          action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}><Plus size={14} /> New Log</button>} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                <div className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} /> {formatDate(log.date)}
                    {log.timeSpent && <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>· {log.timeSpent}</span>}
                  </span>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{log.whatTested}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }} className="hover:opacity-80 p-1 shrink-0">
                  <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              </button>
              {expanded === log.id && (
                <div className="p-5 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {log.whatTested && <Field label="Tested" value={log.whatTested} />}
                  {log.toolsUsed && <Field label="Tools" value={log.toolsUsed} />}
                  {log.whatFound && <Field label="Found" value={log.whatFound} />}
                  {log.nextSteps && <Field label="Next Steps" value={log.nextSteps} />}
                  {log.aiSummary && (
                    <div className="rounded-lg p-4" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>AI Summary</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{log.aiSummary}</p>
                    </div>
                  )}
                  <button onClick={() => summarizeLog(log.id)} disabled={summarizing === log.id}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                    {summarizing === log.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {summarizing === log.id ? 'Summarizing…' : 'Summarize with AI'}
                  </button>
                </div>
              )}
            </div>
          ))}
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
