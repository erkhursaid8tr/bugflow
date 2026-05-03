import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildReportPrompt } from '@/lib/ai-prompts';

// GET /api/reports?findingId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const findingId = searchParams.get('findingId');

  const reports = await prisma.report.findMany({
    where: findingId ? { findingId } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      finding: {
        select: { id: true, title: true, severity: true, status: true },
      },
    },
  });

  return NextResponse.json(reports);
}

// POST /api/reports — generate a report from a finding
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { findingId, style = 'PROFESSIONAL' } = body;

  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      program: true,
      evidence: true,
    },
  });

  if (!finding) {
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
  }

  const evidenceText = finding.evidence.length > 0
    ? finding.evidence.map((e) => `[${e.type}] ${e.title}\n${e.content}`).join('\n\n---\n\n')
    : finding.evidenceSummary || '(No evidence attached)';

  try {
    const messages = buildReportPrompt(
      finding,
      finding.program.name,
      `In Scope: ${finding.program.inScope}\nOut of Scope: ${finding.program.outOfScope}`,
      evidenceText,
      style
    );

    const content = await askOllama(messages, { num_predict: 4096 });

    const report = await prisma.report.create({
      data: {
        findingId,
        title: `Report: ${finding.title}`,
        style,
        content,
      },
    });

    // Update finding status
    if (finding.status === 'CONFIRMED') {
      await prisma.finding.update({
        where: { id: findingId },
        data: { status: 'REPORT_DRAFTED' },
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Report generation failed', details: message }, { status: 503 });
  }
}
