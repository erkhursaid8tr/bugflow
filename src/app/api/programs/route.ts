import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/programs — list user's programs
export async function GET(req: NextRequest) {
  const user = await requireUser(req);

  const programs = await prisma.program.findMany({
    where: { userId: user.id },
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
  const user = await requireUser(req);
  const body = await req.json();

  const program = await prisma.program.create({
    data: {
      userId: user.id,
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
