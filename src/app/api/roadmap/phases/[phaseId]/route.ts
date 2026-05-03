import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ phaseId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { phaseId } = await params;
  const body = await req.json();

  const phase = await prisma.roadmapPhase.update({
    where: { id: phaseId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.userNotes !== undefined && { userNotes: body.userNotes }),
    },
  });

  // ── Auto-unlock next phase when DONE or SKIPPED ──────────────────────
  if (body.status === 'DONE' || body.status === 'SKIPPED') {
    const nextPhase = await prisma.roadmapPhase.findFirst({
      where: {
        programId: phase.programId,
        order: phase.order + 1,
      },
    });

    if (nextPhase && nextPhase.status === 'LOCKED') {
      await prisma.roadmapPhase.update({
        where: { id: nextPhase.id },
        data: { status: 'TODO' },
      });
    }
  }

  return NextResponse.json(phase);
}
