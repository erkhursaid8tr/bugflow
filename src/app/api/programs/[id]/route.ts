import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/programs/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      targets: { orderBy: { createdAt: 'desc' } },
      roadmapPhases: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
      findings: { orderBy: { updatedAt: 'desc' } },
      reconNotes: { orderBy: { createdAt: 'desc' } },
      _count: { select: { targets: true, findings: true } },
    },
  });

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  return NextResponse.json(program);
}

// PATCH /api/programs/[id]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();

  const program = await prisma.program.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(program);
}

// DELETE /api/programs/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
