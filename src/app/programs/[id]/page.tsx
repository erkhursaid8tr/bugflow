import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireServerUser } from '@/lib/auth-page';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import GuidanceBanner from '@/components/ui/GuidanceBanner';
import { formatDateTime, platformColor, truncate } from '@/lib/utils';
import {
  ExternalLink,
  Target,
  Bug,
  Map,
  ScanSearch,
  FileText,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Pencil,
} from 'lucide-react';
import ProgramStatusSelector from './ProgramStatusSelector';

type PageProps = { params: Promise<{ id: string }> };

export default async function ProgramDetailPage({ params }: PageProps) {
  const user = await requireServerUser();
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id, userId: user.id },
    include: {
      targets: { orderBy: { priority: 'asc' }, take: 5 },
      findings: { orderBy: { updatedAt: 'desc' }, take: 5 },
      roadmapPhases: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
      reconNotes: { orderBy: { createdAt: 'desc' }, take: 3 },
      _count: {
        select: {
          targets: true, findings: true, roadmapPhases: true, reconNotes: true,
        },
      },
    },
  });

  if (!program) notFound();

  const donePhases = program.roadmapPhases.filter((p) => p.status === 'DONE').length;
  const totalPhases = program.roadmapPhases.length;
  const progressPct = totalPhases > 0 ? Math.round((donePhases / totalPhases) * 100) : 0;

  const tabs = [
    { label: 'Scope', href: `/programs/${id}/scope`, icon: ShieldCheck },
    { label: 'Targets', href: `/programs/${id}/targets`, icon: Target, count: program._count.targets },
    { label: 'Roadmap', href: `/programs/${id}/roadmap`, icon: Map, count: totalPhases },
    { label: 'Recon Notes', href: `/programs/${id}/recon`, icon: ScanSearch, count: program._count.reconNotes },
    { label: 'Findings', href: `/programs/${id}/findings`, icon: Bug, count: program._count.findings },
    { label: 'Reports', href: `/programs/${id}/reports`, icon: FileText },
    { label: 'Daily Logs', href: `/programs/${id}/logs`, icon: CalendarDays },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Program header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${platformColor(program.platform)}`}>
              {program.platform}
            </span>
            <ProgramStatusSelector programId={id} currentStatus={program.status} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {program.name}
          </h1>
          {program.programUrl && (
            <a href={program.programUrl} target="_blank" rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: 'var(--accent)' }}>
              <ExternalLink size={11} />
              {program.programUrl}
            </a>
          )}
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Updated {formatDateTime(program.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DeleteButton
            endpoint={`/api/programs/${id}`}
            itemName="Program"
            redirectUrl="/programs"
            variant="button"
          />
          <Link
            href={`/programs/${id}/edit`}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ label, href, icon: Icon, count }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Icon size={14} />
            {label}
            {count !== undefined && (
              <span className="rounded-full px-1.5 py-0.5 text-xs"
                style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <GuidanceBanner
        title="Your Bug Bounty Workflow"
        description="Follow these steps to systematically test this program and maximize your chances of finding valid bugs."
        steps={[
          'Review the Scope — understand what you can and cannot test',
          'Generate a Roadmap — get an AI-powered step-by-step testing plan',
          'Follow Each Phase — work through phases one at a time with detailed guidance',
          'Log Recon Notes — paste tool output and let AI analyze it',
          'Record Findings — track bugs from idea to confirmed vulnerability',
          'Generate Reports — create professional submission-ready reports',
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Scope Summary */}
          {program.aiScopeSummary ? (
            <div className="rounded-xl p-5"
              style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--accent)' }}>
                <Sparkles size={14} />
                AI Scope Summary
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {program.aiScopeSummary}
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No AI scope summary yet.{' '}
                <Link href={`/programs/${id}/roadmap`} style={{ color: 'var(--accent)' }}>
                  Generate roadmap →
                </Link>
              </p>
            </div>
          )}

          {/* Safety summary */}
          {program.aiSafetySummary && (
            <div className="rounded-xl p-5"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"
                style={{ color: '#fbbf24' }}>
                <ShieldAlert size={14} />
                Safety Briefing
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {program.aiSafetySummary}
              </p>
            </div>
          )}

          {/* Scope details */}
          <div className="rounded-xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Scope
              </h2>
              <Link href={`/programs/${id}/edit`} className="text-xs hover:opacity-80"
                style={{ color: 'var(--accent)' }}>
                Edit →
              </Link>
            </div>
            {program.inScope && (
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>In Scope</p>
                <pre className="text-xs whitespace-pre-wrap rounded-lg p-3 font-mono"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  {program.inScope}
                </pre>
              </div>
            )}
            {program.outOfScope && (
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--red)' }}>Out of Scope</p>
                <pre className="text-xs whitespace-pre-wrap rounded-lg p-3 font-mono"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  {program.outOfScope}
                </pre>
              </div>
            )}
            {!program.inScope && !program.outOfScope && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No scope defined.{' '}
                <Link href={`/programs/${id}/edit`} style={{ color: 'var(--accent)' }}>
                  Edit program →
                </Link>
              </p>
            )}
          </div>

          {/* Recent findings */}
          {program.findings.length > 0 && (
            <div className="rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Recent Findings
                </h2>
                <Link href={`/programs/${id}/findings`} className="text-xs"
                  style={{ color: 'var(--accent)' }}>View all →</Link>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {program.findings.map((f) => (
                  <div key={f.id} className="px-5 py-3.5 flex items-center justify-between gap-2">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {truncate(f.title, 50)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={f.severity} size="sm" />
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Roadmap progress */}
          <div className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Roadmap Progress
            </h2>
            {totalPhases > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {donePhases} / {totalPhases} phases done
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-base)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #0ea5e9, #7c3aed)',
                    }}
                  />
                </div>
                <Link href={`/programs/${id}/roadmap`}
                  className="mt-3 block text-center text-xs rounded-lg py-2 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Open Roadmap →
                </Link>
              </>
            ) : (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  No roadmap yet. Generate one with AI.
                </p>
                <Link href={`/programs/${id}/roadmap`}
                  className="block text-center text-xs rounded-lg py-2"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Generate Roadmap →
                </Link>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="rounded-xl p-5 space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Quick Stats
            </h2>
            {[
              { label: 'Targets', value: program._count.targets },
              { label: 'Findings', value: program._count.findings },
              { label: 'Recon Notes', value: program._count.reconNotes },
              { label: 'Roadmap Phases', value: totalPhases },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Recent targets */}
          {program.targets.length > 0 && (
            <div className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Targets
              </h2>
              <div className="space-y-2">
                {program.targets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {t.name}
                    </span>
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                ))}
              </div>
              <Link href={`/programs/${id}/targets`}
                className="mt-3 block text-center text-xs" style={{ color: 'var(--accent)' }}>
                Manage targets →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
