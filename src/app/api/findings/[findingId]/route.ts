import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ findingId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { findingId } = await params;
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      program: true,
      target: true,
      evidence: true,
      reports: true,
    },
  });
  if (!finding) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(finding);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { findingId } = await params;
  const body = await req.json();
  const finding = await prisma.finding.update({ where: { id: findingId }, data: body });
  return NextResponse.json(finding);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { findingId } = await params;
  await prisma.finding.delete({ where: { id: findingId } });
  return NextResponse.json({ success: true });
}
