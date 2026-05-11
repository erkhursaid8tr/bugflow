import { prisma } from '@/lib/prisma';
import { requireServerUser } from '@/lib/auth-page';

export const dynamic = 'force-dynamic';
import { Target } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

export default async function GlobalTargetsPage() {
  const user = await requireServerUser();

  const targets = await prisma.target.findMany({
    where: { program: { userId: user.id } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    include: { program: { select: { id: true, name: true } } },
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          <Target size={22} /> All Targets
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {targets.length} targets across all programs
        </p>
      </div>

      {targets.length === 0 ? (
        <EmptyState title="No targets yet"
          description="Targets are added inside individual programs."
          icon={<Target size={40} />}
          action={<Link href="/programs"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            Go to Programs
          </Link>} />
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Program', 'Type', 'Priority', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {targets.map((t) => (
                <tr key={t.id} style={{ background: 'var(--bg-card)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                  <td className="px-4 py-3">
                    <Link href={`/programs/${t.program.id}/targets`}
                      className="text-xs hover:opacity-80" style={{ color: 'var(--accent)' }}>
                      {t.program.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{t.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.priority} size="sm" /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
