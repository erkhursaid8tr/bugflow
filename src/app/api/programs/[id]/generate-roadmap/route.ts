import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildScopeSummaryPrompt, ROADMAP_PHASE_TITLES } from '@/lib/ai-prompts';
import { safeParseJson } from '@/lib/utils';
import { requireUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/programs/[id]/generate-roadmap
// Generates scope summary + creates 18 roadmap phase shells (no bulk AI for roadmap)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await requireUser(req);
  const { id } = await params;

  const program = await prisma.program.findUnique({ where: { id } });
  if (!program || program.userId !== user.id) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 });
  }

  try {
    // ── Step 1: Scope Summary (quick, small AI call) ─────────────────────
    const scopeMessages = buildScopeSummaryPrompt(program);
    const scopeRaw = await askOllama(scopeMessages);

    interface ScopeSummaryResult {
      scopeSummary?: string;
      safetySummary?: string;
    }
    const scopeData = safeParseJson<ScopeSummaryResult>(scopeRaw);

    const aiScopeSummary = scopeData?.scopeSummary ?? scopeRaw;
    const aiSafetySummary = scopeData?.safetySummary ?? '';

    await prisma.program.update({
      where: { id },
      data: { aiScopeSummary, aiSafetySummary },
    });

    // ── Step 2: Create 18 phase shells (instant, no AI) ──────────────────
    // Delete existing phases for this program before regenerating
    await prisma.roadmapPhase.deleteMany({ where: { programId: id } });

    for (let i = 0; i < ROADMAP_PHASE_TITLES.length; i++) {
      await prisma.roadmapPhase.create({
        data: {
          programId: id,
          title: ROADMAP_PHASE_TITLES[i],
          order: i,
          // Phase 1 starts unlocked (TODO), rest are LOCKED
          status: i === 0 ? 'TODO' : 'LOCKED',
          isGenerated: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      aiScopeSummary,
      aiSafetySummary,
      phasesCreated: ROADMAP_PHASE_TITLES.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Roadmap initialization failed', details: message },
      { status: 503 }
    );
  }
}
