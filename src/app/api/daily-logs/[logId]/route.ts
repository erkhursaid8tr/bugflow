import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildDailyLogSummaryPrompt } from '@/lib/ai-prompts';
import { safeParseJson } from '@/lib/utils';

type RouteParams = { params: Promise<{ logId: string }> };

// PATCH /api/daily-logs/[logId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { logId } = await params;
  const body = await req.json();
  const log = await prisma.dailyLog.update({ where: { id: logId }, data: body });
  return NextResponse.json(log);
}

// DELETE /api/daily-logs/[logId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { logId } = await params;
  await prisma.dailyLog.delete({ where: { id: logId } });
  return NextResponse.json({ success: true });
}

// POST /api/daily-logs/[logId] — AI summarize
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { logId } = await params;
  const log = await prisma.dailyLog.findUnique({ where: { id: logId } });
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const messages = buildDailyLogSummaryPrompt(log);
    const raw = await askOllama(messages);

    interface LogSummaryResult {
      summary?: string;
      keyFindings?: string[];
      suggestedNextSession?: string[];
      openQuestions?: string[];
    }

    const data = safeParseJson<LogSummaryResult>(raw);
    const aiSummary = data
      ? [
          data.summary,
          data.keyFindings?.length ? `\nKey Findings:\n${data.keyFindings.map((f) => `• ${f}`).join('\n')}` : '',
          data.suggestedNextSession?.length ? `\nNext Session:\n${data.suggestedNextSession.map((s) => `• ${s}`).join('\n')}` : '',
          data.openQuestions?.length ? `\nOpen Questions:\n${data.openQuestions.map((q) => `• ${q}`).join('\n')}` : '',
        ].filter(Boolean).join('\n')
      : raw;

    await prisma.dailyLog.update({ where: { id: logId }, data: { aiSummary } });
    return NextResponse.json({ aiSummary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Ollama error', details: message }, { status: 503 });
  }
}
