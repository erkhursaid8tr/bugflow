import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/targets?programId=...
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  // Verify program belongs to user
  if (programId) {
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.userId !== user.id) {
      return NextResponse.json([], { status: 200 });
    }
  }

  const targets = await prisma.target.findMany({
    where: programId
      ? { programId }
      : { program: { userId: user.id } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(targets);
}

// POST /api/targets
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  const body = await req.json();

  // Verify program belongs to user
  const program = await prisma.program.findUnique({ where: { id: body.programId } });
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const target = await prisma.target.create({
    data: {
      programId: body.programId,
      name: body.name,
      url: body.url || '',
      type: body.type || 'WEB',
      priority: body.priority || 'MEDIUM',
      status: body.status || 'NOT_STARTED',
      source: body.source || 'MANUAL',
      notes: body.notes || '',
    },
  });

  return NextResponse.json(target, { status: 201 });
}
