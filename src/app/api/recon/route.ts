import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { askOllama } from '@/lib/ollama';
import { buildReconAnalysisPrompt } from '@/lib/ai-prompts';
import { safeParseJson } from '@/lib/utils';

// GET /api/recon?programId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId');

  const notes = await prisma.reconNote.findMany({
    where: programId ? { programId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { target: { select: { name: true } } },
  });

  return NextResponse.json(notes);
}

// POST /api/recon — create and optionally analyze
export async function POST(req: NextRequest) {
  const body = await req.json();

  const note = await prisma.reconNote.create({
    data: {
      programId: body.programId,
      targetId: body.targetId || null,
      title: body.title,
      toolName: body.toolName || 'manual notes',
      rawOutput: body.rawOutput || '',
    },
  });

  // If rawOutput is provided, analyze it with Ollama
  if (body.rawOutput && body.analyze) {
    try {
      const program = await prisma.program.findUnique({
        where: { id: body.programId },
        select: { name: true, inScope: true, outOfScope: true },
      });

      if (program) {
        const messages = buildReconAnalysisPrompt(
          body.toolName || 'manual notes',
          body.rawOutput,
          program
        );
        const raw = await askOllama(messages);

        interface ReconResult {
          summary?: string;
          interestingAssets?: string[];
          interestingEndpoints?: string[];
          technologies?: string[];
          suggestedNextSteps?: string[];
          whatToAvoid?: string[];
        }
        const data = safeParseJson<ReconResult>(raw);

        const join = (arr: unknown) => (Array.isArray(arr) ? arr.join('\n') : '');

        await prisma.reconNote.update({
          where: { id: note.id },
          data: {
            aiSummary: data?.summary ?? raw,
            interestingAssets: join(data?.interestingAssets),
            interestingEndpoints: join(data?.interestingEndpoints),
            technologies: join(data?.technologies),
            suggestedNextSteps: join(data?.suggestedNextSteps),
            whatToAvoid: join(data?.whatToAvoid),
          },
        });
      }
    } catch {
      // AI failure doesn't block the save
    }
  }

  const updated = await prisma.reconNote.findUnique({ where: { id: note.id } });
  return NextResponse.json(updated, { status: 201 });
}
