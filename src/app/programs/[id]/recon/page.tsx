'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Sparkles, ScanSearch, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import AiLoadingState from '@/components/ui/AiLoadingState';
import { formatDateTime } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface ReconNote {
  id: string;
  title: string;
  toolName: string;
  rawOutput: string;
  aiSummary: string;
  interestingAssets: string;
  interestingEndpoints: string;
  technologies: string;
  suggestedNextSteps: string;
  whatToAvoid: string;
  createdAt: string;
}

const TOOLS = [
  'subfinder', 'amass', 'httpx', 'waybackurls', 'gau', 'katana',
  'nuclei', 'Burp Suite', 'OWASP ZAP', 'browser notes', 'manual notes',
  'GitHub search', 'crt.sh', 'urlscan.io', 'other',
];

export default function ReconPage() {
  const { id: programId } = useParams<{ id: string }>();
  const [notes, setNotes] = useState<ReconNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', toolName: 'manual notes', rawOutput: '' });

  useEffect(() => {
    fetch(`/api/recon?programId=${programId}`)
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [programId]);

  async function submitNote(analyze: boolean) {
    if (!form.title.trim() || !form.rawOutput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId, analyze }),
      });
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setForm({ title: '', toolName: 'manual notes', rawOutput: '' });
      setShowForm(false);
      setExpanded(note.id);
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Recon Notes</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Paste tool output — AI will analyze it safely
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
          <Plus size={15} /> Add Recon Note
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Recon Note</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ℹ Paste output from tools you ran manually. This app does not run any tools.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input style={inputStyle} placeholder="Note title (e.g. Subfinder output - example.com)"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select style={inputStyle} value={form.toolName}
              onChange={(e) => setForm({ ...form, toolName: e.target.value })}>
              {TOOLS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' as const }}
            rows={12}
            placeholder="Paste raw tool output here..."
            value={form.rawOutput}
            onChange={(e) => setForm({ ...form, rawOutput: e.target.value })}
          />
          <div className="flex gap-2">
            <button onClick={() => submitNote(false)} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Save Only
            </button>
            <button onClick={() => submitNote(true)} disabled={saving}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {saving ? 'Analyzing…' : 'Save & Analyze with AI'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
          {saving && <AiLoadingState message="Ollama is analyzing your recon output…" />}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState title="No recon notes yet"
          description="Paste tool output to get AI-powered analysis."
          icon={<ScanSearch size={40} />}
          action={<button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <Plus size={14} /> Add Recon Note
          </button>} />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOpen = expanded === note.id;
            return (
              <div key={note.id} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  onClick={() => setExpanded(isOpen ? null : note.id)}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {note.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {note.toolName} · {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {note.aiSummary && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.2)' }}>
                        <Sparkles size={10} /> analyzed
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="p-5 space-y-4">
                    {note.aiSummary && (
                      <div className="rounded-lg p-4"
                        style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>AI Summary</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{note.aiSummary}</p>
                      </div>
                    )}
                    {note.interestingAssets && (
                      <Section label="Interesting Assets" content={note.interestingAssets} />
                    )}
                    {note.interestingEndpoints && (
                      <Section label="Interesting Endpoints" content={note.interestingEndpoints} />
                    )}
                    {note.technologies && (
                      <Section label="Technologies" content={note.technologies} />
                    )}
                    {note.suggestedNextSteps && (
                      <Section label="Suggested Next Steps" content={note.suggestedNextSteps} />
                    )}
                    {note.whatToAvoid && (
                      <div className="rounded-lg p-3"
                        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>⚠ What to Avoid</p>
                        <pre className="text-xs whitespace-pre-wrap" style={{ color: '#fbbf24', opacity: 0.8 }}>{note.whatToAvoid}</pre>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Raw Output</p>
                      <pre className="text-xs whitespace-pre-wrap overflow-x-auto rounded-lg p-3 max-h-48 overflow-y-auto"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        {note.rawOutput}
                      </pre>
                    </div>
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

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{content}</pre>
    </div>
  );
}
