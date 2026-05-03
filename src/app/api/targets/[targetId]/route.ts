import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ targetId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { targetId } = await params;
  const body = await req.json();
  const target = await prisma.target.update({ where: { id: targetId }, data: body });
  return NextResponse.json(target);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { targetId } = await params;
  await prisma.target.delete({ where: { id: targetId } });
  return NextResponse.json({ success: true });
}
