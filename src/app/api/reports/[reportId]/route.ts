import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ reportId: string }> };

// GET /api/reports/[reportId]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { reportId } = await params;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { finding: { include: { program: true } } },
  });
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(report);
}

// PATCH /api/reports/[reportId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { reportId } = await params;
  const body = await req.json();
  const report = await prisma.report.update({ where: { id: reportId }, data: body });
  return NextResponse.json(report);
}

// DELETE /api/reports/[reportId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { reportId } = await params;
  await prisma.report.delete({ where: { id: reportId } });
  return NextResponse.json({ success: true });
}
