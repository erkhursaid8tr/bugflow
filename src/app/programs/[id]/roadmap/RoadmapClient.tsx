'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { statusLabel } from '@/lib/utils';
import {
  ChevronDown, ChevronUp, CheckSquare, Square, Minus, Loader2,
  Lock, Sparkles, MessageSquarePlus, Terminal, RefreshCw, Trash2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  stepByStepGuide?: string;
  commands?: string;
  suggestedTools: string;
  expectedOutput: string;
  possibleBugClasses: string;
  safetyNotes: string;
  completionCriteria: string;
  status: string;
  notes: string;
}

interface Phase {
  id: string;
  title: string;
  priority: string;
  status: string;
  isGenerated: boolean;
  order: number;
  goal: string;
  whyItMatters: string;
  manualApproach: string;
  recommendedTools: string;
  whatToLookFor: string;
  possibleBugClasses: string;
  safetyWarnings: string;
  completionCriteria: string;
  userNotes: string;
  tasks: Task[];
}

interface RoadmapClientProps {
  phases: Phase[];
  programId: string;
}

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'];

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'DONE':
      return <CheckSquare size={16} style={{ color: 'var(--green)' }} />;
    case 'SKIPPED':
      return <Minus size={16} style={{ color: 'var(--text-secondary)' }} />;
    case 'IN_PROGRESS':
      return <Square size={16} style={{ color: 'var(--accent)' }} />;
    default:
      return <Square size={16} style={{ color: 'var(--text-muted)' }} />;
  }
}

export default function RoadmapClient({ phases: initialPhases, programId }: RoadmapClientProps) {
  const [phases, setPhases] = useState(initialPhases);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [generatingPhase, setGeneratingPhase] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [noteModalTask, setNoteModalTask] = useState<{ id: string, phaseId: string, notes: string, title: string } | null>(null);
  const [tempNote, setTempNote] = useState('');
  
  const router = useRouter();

  function togglePhase(id: string) {
    const phase = phases.find((p) => p.id === id);
    if (phase && phase.status === 'LOCKED' && !phase.isGenerated) return;

    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function generatePhase(phaseId: string, force = false) {
    setGeneratingPhase(phaseId);
    setGenError(null);
    try {
      const url = force ? `/api/roadmap/phases/${phaseId}/generate?force=true` : `/api/roadmap/phases/${phaseId}/generate`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.details || data.error || 'Generation failed');
        return;
      }
      router.refresh();
      setExpandedPhases((prev) => new Set(prev).add(phaseId));
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
      // Clear expanded phases and refresh
      setExpandedPhases(new Set());
      router.refresh();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function updatePhaseStatus(phaseId: string, status: string) {
    setSaving(phaseId);
    try {
      await fetch(`/api/roadmap/phases/${phaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setPhases((prev) =>
        prev.map((p) => {
          if (p.id === phaseId) return { ...p, status };
          if ((status === 'DONE' || status === 'SKIPPED')) {
            const currentPhase = prev.find((x) => x.id === phaseId);
            if (currentPhase && p.order === currentPhase.order + 1 && p.status === 'LOCKED') {
              return { ...p, status: 'TODO' };
            }
          }
          return p;
        })
      );
    } finally {
      setSaving(null);
    }
  }

  async function updateTaskStatus(taskId: string, phaseId: string, status: string) {
    setSaving(taskId);
    try {
      await fetch(`/api/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId
            ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }
            : p
        )
      );
    } finally {
      setSaving(null);
    }
  }

  async function saveNote() {
    if (!noteModalTask) return;
    setSaving(noteModalTask.id);
    try {
      await fetch(`/api/roadmap/tasks/${noteModalTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: tempNote }),
      });
      setPhases((prev) =>
        prev.map((p) =>
          p.id === noteModalTask.phaseId
            ? { ...p, tasks: p.tasks.map((t) => (t.id === noteModalTask.id ? { ...t, notes: tempNote } : t)) }
            : p
        )
      );
    } finally {
      setSaving(null);
      setNoteModalTask(null);
      router.refresh();
    }
  }

  const priorityColor: Record<string, string> = {
    CRITICAL: 'var(--red)',
    HIGH: '#fb923c',
    MEDIUM: 'var(--yellow)',
    LOW: 'var(--text-secondary)',
  };

  return (
    <div className="space-y-3 relative">
      {/* Modal Overlay */}
      {noteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Add Output / Notes
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {noteModalTask.title}
              </p>
            </div>
            <div className="p-5">
              <textarea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="Paste command output, recon data, or findings here..."
                className="w-full h-40 text-sm p-3 rounded-lg focus:outline-none resize-none font-mono"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Notes saved here will be automatically appended to today's Daily Log.
              </p>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setNoteModalTask(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={saving === noteModalTask.id}
                className="px-4 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-2"
                style={{ background: 'var(--accent)' }}
              >
                {saving === noteModalTask.id && <Loader2 size={14} className="animate-spin" />}
                Save & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {genError && (
        <div className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
          ⚠ Error: {genError}
          <button onClick={() => setGenError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {phases.length > 0 && (
        <div className="flex justify-end mb-4">
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
        const isExpanded = expandedPhases.has(phase.id);
        const isLocked = phase.status === 'LOCKED' && !phase.isGenerated;
        const isGenerating = generatingPhase === phase.id;
        const needsGeneration = !phase.isGenerated && phase.status !== 'LOCKED';
        const doneTasks = phase.tasks.filter((t) => t.status === 'DONE').length;
        const taskProgress = phase.tasks.length > 0
          ? Math.round((doneTasks / phase.tasks.length) * 100) : 0;

        return (
          <div
            key={phase.id}
            className="rounded-xl overflow-hidden transition-opacity"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isLocked ? 'var(--border-subtle)' : 'var(--border)'}`,
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            <div
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${!isLocked ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'}`}
              onClick={() => !isLocked && togglePhase(phase.id)}
            >
              <span className="shrink-0 text-xs font-mono w-6 text-center"
                style={{ color: 'var(--text-muted)' }}>
                {String(idx + 1).padStart(2, '0')}
              </span>

              {isLocked ? (
                <Lock size={14} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <div className="shrink-0 h-2 w-2 rounded-full"
                  style={{ background: priorityColor[phase.priority] ?? 'var(--text-secondary)' }} />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm" style={{ color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {phase.title}
                </p>
                {phase.goal && !isLocked && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {phase.goal}
                  </p>
                )}
              </div>

              {phase.isGenerated && phase.tasks.length > 0 && (
                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-base)' }}>
                    <div className="h-full rounded-full"
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

              {!isLocked && phase.isGenerated && (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                  <select
                    value={phase.status}
                    onChange={(e) => updatePhaseStatus(phase.id, e.target.value)}
                    disabled={saving === phase.id}
                    className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => generatePhase(phase.id, true)}
                    disabled={isGenerating}
                    title="Regenerate Phase Details"
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                  </button>
                </div>
              )}

              {!isLocked && (
                isExpanded ? (
                  <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                )
              )}
            </div>

            {needsGeneration && (
              <div className="px-5 pb-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="pt-4 flex flex-col items-center gap-3">
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    This phase is unlocked. Generate detailed tasks and guidance with AI.
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); generatePhase(phase.id); }}
                    disabled={isGenerating}
                    className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {isGenerating ? 'Generating details…' : 'Generate Phase Details'}
                  </button>
                  {isGenerating && (
                    <p className="text-xs ai-loading" style={{ color: 'var(--accent)' }}>
                      AI is generating tasks for this phase (~15-30 seconds)…
                    </p>
                  )}
                </div>
              </div>
            )}

            {isExpanded && phase.isGenerated && (
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="px-5 py-4 grid gap-4 md:grid-cols-2">
                  {phase.whyItMatters && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Why It Matters</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{phase.whyItMatters}</p>
                    </div>
                  )}
                  {phase.manualApproach && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Manual Approach</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{phase.manualApproach}</p>
                    </div>
                  )}
                  {phase.whatToLookFor && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>What to Look For</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{phase.whatToLookFor}</p>
                    </div>
                  )}
                  {phase.recommendedTools && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Recommended Tools</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{phase.recommendedTools}</p>
                    </div>
                  )}
                  {phase.possibleBugClasses && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Possible Bug Classes</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{phase.possibleBugClasses}</p>
                    </div>
                  )}
                  {phase.safetyWarnings && (
                    <div className="md:col-span-2 rounded-lg px-3 py-2.5"
                      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--yellow)' }}>⚠ Safety Warnings</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--yellow)', opacity: 0.8 }}>{phase.safetyWarnings}</p>
                    </div>
                  )}
                </div>

                {phase.tasks.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="px-5 py-3 text-xs font-semibold"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                      Tasks ({phase.tasks.length})
                    </p>
                    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                updateTaskStatus(
                                  task.id,
                                  phase.id,
                                  task.status === 'DONE' ? 'TODO' : 'DONE'
                                )
                              }
                              disabled={saving === task.id}
                              className="shrink-0 mt-0.5"
                            >
                              {saving === task.id ? (
                                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                              ) : (
                                <StatusIcon status={task.status} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through' : ''}`}
                                    style={{ color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => {
                                      setTempNote(task.notes || '');
                                      setNoteModalTask({ id: task.id, phaseId: phase.id, notes: task.notes || '', title: task.title });
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
                                    style={{ 
                                      color: task.notes ? 'var(--accent)' : 'var(--text-secondary)',
                                      background: 'var(--bg-base)',
                                      border: '1px solid var(--border-subtle)'
                                    }}
                                  >
                                    <MessageSquarePlus size={14} />
                                    {task.notes ? 'Edit Notes' : 'Add Note'}
                                  </button>
                                  <select
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task.id, phase.id, e.target.value)}
                                    disabled={saving === task.id}
                                    className="text-xs rounded px-2 py-1 focus:outline-none"
                                    style={{
                                      background: 'var(--bg-base)',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    {STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>{statusLabel(s)}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              
                              {/* Step-by-Step Guide */}
                              {task.stepByStepGuide && (
                                <div className="mt-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Step-by-Step Guide</p>
                                  <ol className="list-decimal pl-4 space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {task.stepByStepGuide.split('\n').map((step, i) => (
                                      <li key={i} className="pl-1">{step.replace(/^-\s*/, '')}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Commands */}
                              {task.commands && (
                                <div className="mt-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <Terminal size={12} /> Suggested Commands
                                  </p>
                                  <div className="space-y-1.5">
                                    {task.commands.split('\n').map((cmd, i) => (
                                      <div key={i} className="px-3 py-2 rounded-md font-mono text-[11px] overflow-x-auto" 
                                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                        {cmd}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {task.safetyNotes && (
                                <p className="text-xs mt-3" style={{ color: 'var(--yellow)', opacity: 0.9 }}>
                                  ⚠ {task.safetyNotes}
                                </p>
                              )}

                              {/* Existing Notes Display */}
                              {task.notes && (
                                <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                                  <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Your Notes / Output:</p>
                                  <pre className="font-mono whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                    {task.notes}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
