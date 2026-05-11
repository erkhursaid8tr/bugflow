import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/findings?programId=...
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  const findings = await prisma.finding.findMany({
    where: programId
      ? { programId, program: { userId: user.id } }
      : { program: { userId: user.id } },
    orderBy: { updatedAt: 'desc' },
    include: {
      program: { select: { name: true } },
      target: { select: { name: true } },
      evidence: { select: { id: true, type: true, title: true } },
    },
  });

  return NextResponse.json(findings);
}

// POST /api/findings
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  const body = await req.json();

  // Verify program belongs to user
  const program = await prisma.program.findUnique({ where: { id: body.programId } });
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const finding = await prisma.finding.create({
    data: {
      programId: body.programId,
      targetId: body.targetId || null,
      title: body.title,
      vulnerabilityType: body.vulnerabilityType || 'Other',
      endpoint: body.endpoint || '',
      severity: body.severity || 'MEDIUM',
      status: body.status || 'IDEA',
      description: body.description || '',
      stepsTested: body.stepsTested || '',
      evidenceSummary: body.evidenceSummary || '',
      impact: body.impact || '',
    },
  });

  return NextResponse.json(finding, { status: 201 });
}
