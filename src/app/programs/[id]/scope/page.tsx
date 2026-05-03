import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import ScopeActions from './ScopeActions';

type PageProps = { params: Promise<{ id: string }> };

export default async function ScopePage({ params }: PageProps) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: { scopeItems: { orderBy: { type: 'asc' } } },
  });

  if (!program) notFound();

  const sections = [
    { label: 'In-Scope Assets', value: program.inScope, color: '#34d399' },
    { label: 'Out-of-Scope Assets', value: program.outOfScope, color: '#f87171' },
    { label: 'Allowed Testing', value: program.allowedTesting, color: '#38bdf8' },
    { label: 'Forbidden Testing', value: program.forbiddenTesting, color: '#f87171' },
    { label: 'Rate Limits', value: program.rateLimits, color: '#fbbf24' },
    { label: 'Reward Information', value: program.rewardInfo, color: '#a78bfa' },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/programs/${id}`} className="text-xs hover:opacity-80 mb-1 block"
          style={{ color: 'var(--text-muted)' }}>← {program.name}</Link>
        <h1 className="flex items-center gap-2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          <ShieldCheck size={20} /> Scope
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Review what you can and cannot test
        </p>
      </div>

      {/* AI scope summary */}
      {program.aiScopeSummary && (
        <div className="mb-5 rounded-xl p-5"
          style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              <Sparkles size={14} /> AI Scope Summary
            </h2>
            <ScopeActions programId={id} summary={program.aiScopeSummary} />
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {program.aiScopeSummary}
          </p>
        </div>
      )}

      {/* Safety summary */}
      {program.aiSafetySummary && (
        <div className="mb-5 rounded-xl p-5"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <h2 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: '#fbbf24' }}>
            <AlertTriangle size={14} /> Safety Briefing
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {program.aiSafetySummary}
          </p>
        </div>
      )}

      {/* Scope sections */}
      <div className="space-y-4">
        {sections.map(({ label, value, color }) => (
          value ? (
            <div key={label} className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color }}>
                {label}
              </p>
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed rounded-lg p-3"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                {value}
              </pre>
            </div>
          ) : null
        ))}
      </div>

      {/* Raw program text */}
      {program.rawProgramText && (
        <div className="mt-6 rounded-xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Raw Program Text
          </p>
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed rounded-lg p-3 max-h-64 overflow-y-auto"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            {program.rawProgramText}
          </pre>
        </div>
      )}

      {/* No scope message */}
      {!program.inScope && !program.outOfScope && !program.rawProgramText && (
        <div className="rounded-xl p-8 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No scope details added yet. Edit the program to paste the scope.
          </p>
        </div>
      )}
    </div>
  );
}
