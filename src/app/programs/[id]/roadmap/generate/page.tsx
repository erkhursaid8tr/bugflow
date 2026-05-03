'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Sparkles, Map } from 'lucide-react';
import AiLoadingState from '@/components/ui/AiLoadingState';

export default function GenerateRoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/programs/${id}/generate-roadmap`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || 'Initialization failed');
        return;
      }
      router.push(`/programs/${id}/roadmap`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="flex items-center gap-2 text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        <Map size={20} /> Initialize AI Roadmap
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        This will analyze the program scope and create an 18-phase testing roadmap.
        Each phase generates individually — so you get detailed, context-aware guidance as you progress.
      </p>

      <div className="rounded-xl p-5 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          How it works:
        </p>
        <ol className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
          <li>1. AI analyzes your program scope (quick summary)</li>
          <li>2. Creates 18 phase shells (instant)</li>
          <li>3. Phase 1 unlocks — click &quot;Generate Details&quot; for AI tasks</li>
          <li>4. Complete a phase → next one unlocks automatically</li>
          <li>5. Each phase sees your findings from previous phases</li>
        </ol>
      </div>

      <div className="rounded-xl p-4 mb-6"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <p className="text-xs" style={{ color: 'var(--yellow)' }}>
          ⚠ The AI scope analysis takes about 15-30 seconds.
          Any existing roadmap for this program will be replaced.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? 'Initializing roadmap…' : 'Initialize Roadmap'}
      </button>

      {generating && (
        <div className="mt-4">
          <AiLoadingState message="Analyzing program scope and creating 18 phase shells…" />
        </div>
      )}
    </div>
  );
}
