'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { statusLabel } from '@/lib/utils';
import {
  CheckSquare, Square, Minus, Loader2,
  Sparkles, MessageSquarePlus, Terminal, RefreshCw,
  Lock, AlertTriangle, Lightbulb, Search, Wrench, Bug, Shield
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

const sectionIcons: Record<string, React.ReactNode> = {
  'Why It Matters': <Lightbulb size={14} />,
  'Manual Approach': <Search size={14} />,
  'What to Look For': <Search size={14} />,
  'Recommended Tools': <Wrench size={14} />,
  'Possible Bug Classes': <Bug size={14} />,
  'Completion Criteria': <CheckSquare size={14} />,
};

export default function PhaseDetailClient({ phase: initialPhase, programId }: { phase: Phase; programId: string }) {
  const [phase, setPhase] = useState(initialPhase);
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [noteModalTask, setNoteModalTask] = useState<{ id: string; notes: string; title: string } | null>(null);
  const [tempNote, setTempNote] = useState('');
  const router = useRouter();

  const priorityColor: Record<string, string> = {
    CRITICAL: 'var(--red)',
    HIGH: '#fb923c',
    MEDIUM: 'var(--accent)',
    LOW: 'var(--text-secondary)',
  };

  async function generatePhase(force = false) {
    setGenerating(true);
    setGenError(null);
    try {
      const url = force
        ? `/api/roadmap/phases/${phase.id}/generate?force=true`
        : `/api/roadmap/phases/${phase.id}/generate`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.details || data.error || 'Generation failed');
        return;
      }
      // Auto-refresh to show new data
      router.refresh();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  async function updatePhaseStatus(status: string) {
    setSaving(phase.id);
    try {
      await fetch(`/api/roadmap/phases/${phase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setPhase((prev) => ({ ...prev, status }));
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    setSaving(taskId);
    try {
      await fetch(`/api/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setPhase((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      }));
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
      setPhase((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === noteModalTask.id ? { ...t, notes: tempNote } : t
        ),
      }));
    } finally {
      setSaving(null);
      setNoteModalTask(null);
    }
  }

  const doneTasks = phase.tasks.filter((t) => t.status === 'DONE').length;
  const taskProgress = phase.tasks.length > 0
    ? Math.round((doneTasks / phase.tasks.length) * 100) : 0;

  const needsGeneration = !phase.isGenerated && phase.status !== 'LOCKED';
  const isLocked = phase.status === 'LOCKED' && !phase.isGenerated;

  return (
    <div>
      {/* Note Modal */}
      {noteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setNoteModalTask(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg"
                style={{ color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={saveNote} disabled={saving === noteModalTask.id}
                className="px-4 py-2 text-xs font-medium rounded-lg text-white flex items-center gap-2"
                style={{ background: 'var(--accent)' }}>
                {saving === noteModalTask.id && <Loader2 size={14} className="animate-spin" />}
                Save & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)' }}>
          ⚠ Error: {genError}
          <button onClick={() => setGenError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Locked State */}
      {isLocked && (
        <div className="rounded-xl p-8 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.7 }}>
          <Lock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            This phase is locked
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Complete or skip the previous phase to unlock this one.
          </p>
        </div>
      )}

      {/* Needs Generation */}
      {needsGeneration && (
        <div className="rounded-xl p-8 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            This phase is unlocked and ready for AI generation
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Generate detailed tasks, step-by-step guides, and commands tailored to this program.
          </p>
          <button
            onClick={() => generatePhase(false)}
            disabled={generating}
            className="flex items-center gap-2 mx-auto rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? 'Generating details…' : 'Generate Phase Details'}
          </button>
          {generating && (
            <p className="text-xs mt-3 ai-loading" style={{ color: 'var(--accent)' }}>
              AI is generating tasks for this phase (~15-30 seconds)…
            </p>
          )}
        </div>
      )}

      {/* Generated Phase Content */}
      {phase.isGenerated && (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</span>
                <div className="mt-1">
                  <select
                    value={phase.status}
                    onChange={(e) => updatePhaseStatus(e.target.value)}
                    disabled={saving === phase.id}
                    className="text-sm rounded-lg px-3 py-1.5 focus:outline-none font-medium"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Priority</span>
                <p className="text-sm font-medium mt-1" style={{ color: priorityColor[phase.priority] }}>
                  {phase.priority}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {doneTasks}/{phase.tasks.length} tasks
                </span>
                <div className="w-24 h-1.5 rounded-full overflow-hidden mt-1"
                  style={{ background: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${taskProgress}%`,
                      background: taskProgress === 100 ? 'var(--green)' : 'linear-gradient(90deg, #0ea5e9, #7c3aed)',
                    }} />
                </div>
              </div>
              <button
                onClick={() => generatePhase(true)}
                disabled={generating}
                title="Regenerate Phase"
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Phase Goal */}
          {phase.goal && (
            <div className="rounded-xl p-5"
              style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(124,58,237,0.06))', border: '1px solid rgba(56,189,248,0.15)' }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                <Lightbulb size={14} /> Goal
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{phase.goal}</p>
            </div>
          )}

          {/* Info Sections in Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: 'Why It Matters', content: phase.whyItMatters },
              { label: 'Manual Approach', content: phase.manualApproach },
              { label: 'What to Look For', content: phase.whatToLookFor },
              { label: 'Recommended Tools', content: phase.recommendedTools },
              { label: 'Possible Bug Classes', content: phase.possibleBugClasses },
              { label: 'Completion Criteria', content: phase.completionCriteria },
            ].filter((s) => s.content).map((section) => (
              <div key={section.label} className="rounded-xl p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  {sectionIcons[section.label]} {section.label}
                </p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Safety Warnings */}
          {phase.safetyWarnings && (
            <div className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--yellow)' }}>
                <Shield size={14} /> Safety Warnings
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--yellow)', opacity: 0.8 }}>
                {phase.safetyWarnings}
              </p>
            </div>
          )}

          {/* Tasks */}
          {phase.tasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}>
                <CheckSquare size={16} /> Tasks ({phase.tasks.length})
              </h2>
              <div className="space-y-3">
                {phase.tasks.map((task) => (
                  <div key={task.id} className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => updateTaskStatus(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                          disabled={saving === task.id}
                          className="shrink-0 mt-0.5"
                        >
                          {saving === task.id
                            ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                            : <StatusIcon status={task.status} />
                          }
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
                                  setNoteModalTask({ id: task.id, notes: task.notes || '', title: task.title });
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
                                style={{
                                  color: task.notes ? 'var(--accent)' : 'var(--text-secondary)',
                                  background: 'var(--bg-base)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                <MessageSquarePlus size={14} />
                                {task.notes ? 'Edit' : 'Note'}
                              </button>
                              <select
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                disabled={saving === task.id}
                                className="text-xs rounded px-2 py-1 focus:outline-none"
                                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{statusLabel(s)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Step-by-Step Guide */}
                          {task.stepByStepGuide && (
                            <div className="mt-4 rounded-lg p-4"
                              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Step-by-Step Guide
                              </p>
                              <ol className="list-decimal pl-4 space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                {task.stepByStepGuide.split('\n').map((step, i) => (
                                  <li key={i} className="pl-1 leading-relaxed">{step.replace(/^-\s*/, '')}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Commands */}
                          {task.commands && (
                            <div className="mt-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2"
                                style={{ color: 'var(--text-secondary)' }}>
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

                          {/* Safety Notes */}
                          {task.safetyNotes && (
                            <p className="text-xs mt-3" style={{ color: 'var(--yellow)', opacity: 0.9 }}>
                              ⚠ {task.safetyNotes}
                            </p>
                          )}

                          {/* Existing Notes */}
                          {task.notes && (
                            <div className="mt-3 p-3 rounded-lg text-xs"
                              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                              <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Your Notes / Output:</p>
                              <pre className="font-mono whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                {task.notes}
                              </pre>
                            </div>
                          )}
                        </div>
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
}
