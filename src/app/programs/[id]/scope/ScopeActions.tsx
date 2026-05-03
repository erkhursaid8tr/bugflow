'use client';

import { useState } from 'react';
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react';

interface ScopeActionsProps {
  programId: string;
  summary: string;
}

export default function ScopeActions({ programId, summary }: ScopeActionsProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function copySummary() {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      await fetch(`/api/programs/${programId}/generate-roadmap`, { method: 'POST' });
      window.location.reload();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="flex gap-1.5">
      <button onClick={copySummary}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: copied ? '#34d399' : 'var(--text-muted)' }}>
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button onClick={regenerate} disabled={regenerating}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs disabled:opacity-50"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {regenerating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
        Regenerate
      </button>
    </div>
  );
}
