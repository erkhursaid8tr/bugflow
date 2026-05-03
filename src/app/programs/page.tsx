import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { Plus, FolderKanban, Target, Bug } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDateTime, platformColor } from '@/lib/utils';

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { targets: true, findings: true, roadmapPhases: true } },
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Programs
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {programs.length} bug bounty program{programs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/programs/new"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
        >
          <Plus size={16} />
          New Program
        </Link>
      </div>

      {/* Programs grid */}
      {programs.length === 0 ? (
        <EmptyState
          title="No programs yet"
          description="Add your first bug bounty program to get started. You can paste the full program text and let the AI generate a roadmap."
          icon={<FolderKanban size={48} />}
          action={
            <Link
              href="/programs/new"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
            >
              <Plus size={16} />
              Add Program
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((prog) => (
            <Link
              key={prog.id}
              href={`/programs/${prog.id}`}
              className="group block rounded-xl p-5 transition-all hover:opacity-90"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Platform + status */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${platformColor(prog.platform)}`}
                >
                  {prog.platform}
                </span>
                <StatusBadge status={prog.status} size="sm" />
              </div>

              {/* Program name */}
              <h2 className="font-semibold text-base leading-snug mb-1"
                style={{ color: 'var(--text-primary)' }}>
                {prog.name}
              </h2>

              {prog.programUrl && (
                <p className="text-xs truncate mb-3" style={{ color: 'var(--text-muted)' }}>
                  {prog.programUrl}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Target size={12} />
                  {prog._count.targets} targets
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Bug size={12} />
                  {prog._count.findings} findings
                </span>
                {prog._count.roadmapPhases > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {prog._count.roadmapPhases} phases
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                Updated {formatDateTime(prog.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
