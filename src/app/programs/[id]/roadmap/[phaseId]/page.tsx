import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Map, ChevronLeft, ChevronRight } from 'lucide-react';
import PhaseDetailClient from './PhaseDetailClient';

type PageProps = { params: Promise<{ id: string; phaseId: string }> };

export default async function PhaseDetailPage({ params }: PageProps) {
  const { id, phaseId } = await params;

  const phase = await prisma.roadmapPhase.findUnique({
    where: { id: phaseId },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  if (!phase || phase.programId !== id) notFound();

  // Get all phases for navigation
  const allPhases = await prisma.roadmapPhase.findMany({
    where: { programId: id },
    orderBy: { order: 'asc' },
    select: { id: true, order: true, title: true, status: true },
  });

  const currentIndex = allPhases.findIndex((p) => p.id === phaseId);
  const prevPhase = currentIndex > 0 ? allPhases[currentIndex - 1] : null;
  const nextPhase = currentIndex < allPhases.length - 1 ? allPhases[currentIndex + 1] : null;
  const totalPhases = allPhases.length;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href={`/programs/${id}`} className="hover:opacity-80">Program</Link>
        <span>/</span>
        <Link href={`/programs/${id}/roadmap`} className="hover:opacity-80">Roadmap</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>Phase {phase.order + 1}</span>
      </div>

      {/* Phase Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="flex items-center justify-center rounded-lg h-8 w-8 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {String(phase.order + 1).padStart(2, '0')}
          </span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {phase.title}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Phase {phase.order + 1} of {totalPhases}
            </p>
          </div>
        </div>
      </div>

      {/* Phase Content (Client) */}
      <PhaseDetailClient
        phase={{
          ...phase,
          tasks: phase.tasks,
        }}
        programId={id}
      />

      {/* Phase Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {prevPhase ? (
          <Link
            href={`/programs/${id}/roadmap/${prevPhase.id}`}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Phase {prevPhase.order + 1}:</span> {prevPhase.title.length > 25 ? prevPhase.title.slice(0, 25) + '…' : prevPhase.title}
          </Link>
        ) : <div />}
        {nextPhase ? (
          <Link
            href={`/programs/${id}/roadmap/${nextPhase.id}`}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="hidden sm:inline">Phase {nextPhase.order + 1}:</span> {nextPhase.title.length > 25 ? nextPhase.title.slice(0, 25) + '…' : nextPhase.title}
            <ChevronRight size={16} />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
