import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { requireServerUser } from '@/lib/auth-page';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import { Map, CheckSquare } from 'lucide-react';
import RoadmapClient from './RoadmapClient';

type PageProps = { params: Promise<{ id: string }> };

export default async function RoadmapPage({ params }: PageProps) {
  const user = await requireServerUser();
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id, userId: user.id },
    include: {
      roadmapPhases: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!program) notFound();

  const totalPhases = program.roadmapPhases.length;
  const donePhases = program.roadmapPhases.filter((p) => p.status === 'DONE').length;
  const generatedPhases = program.roadmapPhases.filter((p) => p.isGenerated).length;
  const totalTasks = program.roadmapPhases.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = program.roadmapPhases.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'DONE').length,
    0
  );
  const progressPct = totalPhases > 0 ? Math.round((donePhases / totalPhases) * 100) : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/programs/${id}`} className="text-xs hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>
              ← {program.name}
            </Link>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}>
            <Map size={22} />
            Roadmap
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Step-by-step authorized testing workflow — phases generate one at a time
          </p>
        </div>
      </div>

      {totalPhases === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No roadmap yet"
            description="Generate an AI roadmap to get a detailed, safe, step-by-step testing plan tailored to this program's scope."
            icon={<Map size={48} />}
            action={<RoadmapGenerateButton programId={id} />}
          />
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="mb-6 rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {donePhases} / {totalPhases} phases complete
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {generatedPhases} generated · {doneTasks} / {totalTasks} tasks done
                </span>
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
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
          </div>

          {/* Phases — client component for interactivity */}
          <RoadmapClient phases={program.roadmapPhases} programId={id} />
        </>
      )}
    </div>
  );
}

// Client component for the generate button
function RoadmapGenerateButton({ programId }: { programId: string }) {
  return (
    <Link
      href={`/programs/${programId}/roadmap/generate`}
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
      style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
    >
      <CheckSquare size={16} />
      Initialize AI Roadmap
    </Link>
  );
}
