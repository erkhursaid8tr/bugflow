import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/daily-logs?programId=...
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  const logs = await prisma.dailyLog.findMany({
    where: programId
      ? { programId, userId: user.id }
      : { userId: user.id },
    orderBy: { date: 'desc' },
    include: {
      program: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(logs);
}

// POST /api/daily-logs
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  const body = await req.json();

  // If programId is provided, verify ownership
  if (body.programId) {
    const program = await prisma.program.findUnique({ where: { id: body.programId } });
    if (!program || program.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  const log = await prisma.dailyLog.create({
    data: {
      userId: user.id,
      programId: body.programId || null,
      date: body.date ? new Date(body.date) : new Date(),
      timeSpent: body.timeSpent || '',
      whatTested: body.whatTested || '',
      toolsUsed: body.toolsUsed || '',
      whatFound: body.whatFound || '',
      blockers: body.blockers || '',
      nextSteps: body.nextSteps || '',
      notes: body.notes || '',
    },
  });

  return NextResponse.json(log, { status: 201 });
}
