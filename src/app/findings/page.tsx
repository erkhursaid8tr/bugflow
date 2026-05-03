import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { Bug } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { formatDateTime, truncate } from '@/lib/utils';

export default async function GlobalFindingsPage() {
  const findings = await prisma.finding.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { program: { select: { id: true, name: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          <Bug size={22} /> All Findings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {findings.length} findings across all programs
        </p>
      </div>

      {findings.length === 0 ? (
        <EmptyState title="No findings yet"
          description="Findings are tracked inside each program."
          icon={<Bug size={40} />}
          action={<Link href="/programs"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            Go to Programs
          </Link>} />
      ) : (
        <div className="space-y-2">
          {findings.map((f) => (
            <div key={f.id} className="flex items-center gap-4 rounded-xl px-5 py-3.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {truncate(f.title, 70)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Link href={`/programs/${f.program.id}/findings`}
                    className="text-xs hover:opacity-80" style={{ color: 'var(--accent)' }}>
                    {f.program.name}
                  </Link>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {f.vulnerabilityType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={f.severity} size="sm" />
                <StatusBadge status={f.status} size="sm" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDateTime(f.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
