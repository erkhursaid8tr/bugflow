import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/daily-logs?programId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  const logs = await prisma.dailyLog.findMany({
    where: programId ? { programId } : undefined,
    orderBy: { date: 'desc' },
    include: {
      program: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(logs);
}

// POST /api/daily-logs
export async function POST(req: NextRequest) {
  const body = await req.json();

  const log = await prisma.dailyLog.create({
    data: {
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
