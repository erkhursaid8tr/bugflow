'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { statusLabel } from '@/lib/utils';
import {
  ChevronRight, CheckSquare, Square, Minus, Loader2,
  Lock, Sparkles, Trash2, ArrowRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface Phase {
  id: string;
  title: string;
  priority: string;
  status: string;
  isGenerated: boolean;
  order: number;
  goal: string;
  tasks: Task[];
}

interface RoadmapClientProps {
  phases: Phase[];
  programId: string;
}

const priorityColor: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#fb923c',
  MEDIUM: '#0ea5e9',
  LOW: '#6b7280',
};

const priorityBorder: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.4)',
  HIGH: 'rgba(251,146,60,0.4)',
  MEDIUM: 'rgba(14,165,233,0.3)',
  LOW: 'rgba(107,114,128,0.3)',
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'DONE':
      return <CheckSquare size={14} style={{ color: 'var(--green)' }} />;
    case 'SKIPPED':
      return <Minus size={14} style={{ color: 'var(--text-secondary)' }} />;
    case 'IN_PROGRESS':
      return <Square size={14} style={{ color: 'var(--accent)' }} />;
    default:
      return <Square size={14} style={{ color: 'var(--text-muted)' }} />;
  }
}

export default function RoadmapClient({ phases: initialPhases, programId }: RoadmapClientProps) {
  const [phases, setPhases] = useState(initialPhases);
  const [generatingPhase, setGeneratingPhase] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const router = useRouter();

  async function generatePhase(phaseId: string) {
    setGeneratingPhase(phaseId);
    setGenError(null);
    try {
      const res = await fetch(`/api/roadmap/phases/${phaseId}/generate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.details || data.error || 'Generation failed');
        return;
      }
      // Auto-refresh and navigate to the phase page
      router.refresh();
      router.push(`/programs/${programId}/roadmap/${phaseId}`);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGeneratingPhase(null);
    }
  }

  async function resetRoadmap() {
    if (!window.confirm("Are you sure you want to reset the entire roadmap? All generated tasks and notes will be lost!")) {
      return;
    }
    try {
      const res = await fetch(`/api/programs/${programId}/roadmap/reset`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setGenError(data.error || 'Failed to reset roadmap');
        return;
      }
      router.refresh();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  return (
    <div className="space-y-2">
      {genError && (
        <div className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
          ⚠ Error: {genError}
          <button onClick={() => setGenError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {phases.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={resetRoadmap}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <Trash2 size={14} />
            Reset Roadmap
          </button>
        </div>
      )}

      {phases.map((phase, idx) => {
        const isLocked = phase.status === 'LOCKED' && !phase.isGenerated;
        const isGenerating = generatingPhase === phase.id;
        const needsGeneration = !phase.isGenerated && phase.status !== 'LOCKED';
        const doneTasks = phase.tasks.filter((t) => t.status === 'DONE').length;
        const taskProgress = phase.tasks.length > 0
          ? Math.round((doneTasks / phase.tasks.length) * 100) : 0;

        return (
          <div
            key={phase.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${isLocked ? 'var(--border-subtle)' : (priorityBorder[phase.priority] ?? 'var(--border)')}`,
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            {/* If generated, link to phase page */}
            {phase.isGenerated ? (
              <Link
                href={`/programs/${programId}/roadmap/${phase.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:opacity-90 transition-opacity"
              >
                <span className="shrink-0 flex items-center justify-center rounded-lg h-7 w-7 text-[11px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${priorityColor[phase.priority] ?? '#6b7280'}, ${priorityColor[phase.priority] ?? '#6b7280'}cc)` }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {phase.title}
                  </p>
                  {phase.goal && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {phase.goal.length > 80 ? phase.goal.slice(0, 80) + '…' : phase.goal}
                    </p>
                  )}
                </div>

                {phase.tasks.length > 0 && (
                  <div className="shrink-0 flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-base)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${taskProgress}%`,
                          background: taskProgress === 100 ? 'var(--green)' : 'var(--accent)',
                        }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {doneTasks}/{phase.tasks.length}
                    </span>
                  </div>
                )}

                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: phase.status === 'DONE'
                      ? 'rgba(52,211,153,0.1)' : phase.status === 'IN_PROGRESS'
                        ? 'rgba(56,189,248,0.1)' : 'var(--bg-base)',
                    color: phase.status === 'DONE'
                      ? 'var(--green)' : phase.status === 'IN_PROGRESS'
                        ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${phase.status === 'DONE' ? 'rgba(52,211,153,0.2)' : phase.status === 'IN_PROGRESS' ? 'rgba(56,189,248,0.2)' : 'var(--border-subtle)'}`,
                  }}>
                  {statusLabel(phase.status)}
                </span>

                <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              </Link>
            ) : isLocked ? (
              /* Locked Phase */
              <div className="flex items-center gap-4 px-5 py-4 cursor-default">
                <span className="shrink-0 flex items-center justify-center rounded-lg h-7 w-7 text-[11px] font-bold"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                    {phase.title}
                  </p>
                </div>
                <span className="text-[10px] rounded-full px-2 py-0.5"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                  Locked
                </span>
              </div>
            ) : (
              /* Needs Generation */
              <div className="px-5 py-4">
                <div className="flex items-center gap-4 mb-3">
                  <span className="shrink-0 flex items-center justify-center rounded-lg h-7 w-7 text-[11px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {phase.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Ready to generate — click below to get AI tasks and guidance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => generatePhase(phase.id)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
                >
                  {isGenerating
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Sparkles size={14} />
                  }
                  {isGenerating ? 'Generating…' : 'Generate Phase Details'}
                </button>
                {isGenerating && (
                  <p className="text-xs mt-2 ai-loading" style={{ color: 'var(--accent)' }}>
                    AI is generating tasks for this phase (~15-30 seconds)…
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
