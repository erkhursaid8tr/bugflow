import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/targets?programId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  const targets = await prisma.target.findMany({
    where: programId ? { programId } : undefined,
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(targets);
}

// POST /api/targets
export async function POST(req: NextRequest) {
  const body = await req.json();

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
