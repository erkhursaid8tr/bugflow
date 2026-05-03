import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/evidence
export async function POST(req: NextRequest) {
  const body = await req.json();

  const evidence = await prisma.evidence.create({
    data: {
      findingId: body.findingId,
      type: body.type || 'TEXT_NOTE',
      title: body.title,
      content: body.content || '',
      filePath: body.filePath || null,
      redacted: body.redacted || false,
      notes: body.notes || '',
    },
  });

  return NextResponse.json(evidence, { status: 201 });
}
