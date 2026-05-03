import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/programs — list all programs
export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          targets: true,
          findings: true,
          roadmapPhases: true,
        },
      },
    },
  });
  return NextResponse.json(programs);
}

// POST /api/programs — create a new program
export async function POST(req: NextRequest) {
  const body = await req.json();

  const program = await prisma.program.create({
    data: {
      name: body.name,
      platform: body.platform || 'Other',
      programUrl: body.programUrl || '',
      rawProgramText: body.rawProgramText || '',
      inScope: body.inScope || '',
      outOfScope: body.outOfScope || '',
      allowedTesting: body.allowedTesting || '',
      forbiddenTesting: body.forbiddenTesting || '',
      rateLimits: body.rateLimits || '',
      rewardInfo: body.rewardInfo || '',
      notes: body.notes || '',
      status: body.status || 'NOT_STARTED',
    },
  });

  return NextResponse.json(program, { status: 201 });
}
