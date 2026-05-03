import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import {
  FolderKanban,
  Bug,
  Target,
  FileText,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTime, truncate } from '@/lib/utils';

export default async function DashboardPage() {
  const [programs, findings, targets, reports, logs] = await Promise.all([
    prisma.program.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.finding.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.target.count(),
    prisma.report.count(),
    prisma.dailyLog.findMany({ orderBy: { date: 'desc' }, take: 3 }),
  ]);

  const activePrograms = programs.filter((p) => p.status === 'ACTIVE');
  const confirmedFindings = await prisma.finding.count({
    where: { status: { in: ['CONFIRMED', 'REPORT_DRAFTED', 'REPORTED', 'PAID'] } },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your local bug bounty workspace — all data stays on this machine.
          </p>
        </div>
        <Link
          href="/programs/new"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
        >
          <FolderKanban size={16} />
          New Program
        </Link>
      </div>

      {/* Safety banner */}
      <div
        className="mb-8 flex items-start gap-3 rounded-xl px-5 py-4"
        style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
        }}
      >
        <span className="text-base">⚠️</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
            Authorized Testing Only
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            This tool is for legal, authorized bug bounty and penetration testing work only. Always confirm
            you have explicit permission before testing any target. Never test out-of-scope assets.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Programs"
          value={programs.length}
          icon={<FolderKanban size={20} />}
          accent="#38bdf8"
        />
        <StatCard
          label="Active Programs"
          value={activePrograms.length}
          icon={<TrendingUp size={20} />}
          accent="#34d399"
        />
        <StatCard
          label="Targets"
          value={targets}
          icon={<Target size={20} />}
          accent="#a78bfa"
        />
        <StatCard
          label="Confirmed Findings"
          value={confirmedFindings}
          icon={<Bug size={20} />}
          accent="#f87171"
        />
        <StatCard
          label="Reports"
          value={reports}
          icon={<FileText size={20} />}
          accent="#fbbf24"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Programs */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Programs
            </h2>
            <Link href="/programs" className="flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: 'var(--accent)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {programs.slice(0, 5).map((prog) => (
              <Link
                key={prog.id}
                href={`/programs/${prog.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:opacity-80 transition-opacity"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {prog.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {prog.platform}
                  </p>
                </div>
                <StatusBadge status={prog.status} size="sm" />
              </Link>
            ))}
            {programs.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No programs yet.{' '}
                  <Link href="/programs/new" style={{ color: 'var(--accent)' }}>
                    Add your first program →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Findings */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Findings
            </h2>
            <Link href="/findings" className="flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: 'var(--accent)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {findings.map((f) => (
              <div key={f.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {truncate(f.title, 50)}
                  </p>
                  <StatusBadge status={f.severity} size="sm" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={f.status} size="sm" />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(f.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
            {findings.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No findings yet. Start testing!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Logs */}
        <div
          className="rounded-xl lg:col-span-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
              <CalendarDays size={16} />
              Recent Daily Logs
            </h2>
            <Link href="/logs" className="flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: 'var(--accent)' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {logs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No logs yet.{' '}
                <Link href="/logs" style={{ color: 'var(--accent)' }}>
                  Log today&apos;s work →
                </Link>
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(log.date)}
                    </span>
                    {log.timeSpent && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        • {log.timeSpent}
                      </span>
                    )}
                  </div>
                  {log.whatTested && (
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {truncate(log.whatTested, 100)}
                    </p>
                  )}
                  {log.whatFound && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Found: {truncate(log.whatFound, 80)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
