import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildFindingValidationPrompt } from '@/lib/ai-prompts';
import { safeParseJson } from '@/lib/utils';

// POST /api/ai/finding — validate a finding with Ollama
export async function POST(req: NextRequest) {
  const { findingId } = await req.json();

  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: {
      program: {
        select: { name: true, inScope: true, outOfScope: true, forbiddenTesting: true },
      },
    },
  });

  if (!finding) {
    return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
  }

  const messages = buildFindingValidationPrompt(finding, finding.program);

  try {
    const raw = await askOllama(messages);

    interface ValidationResult {
      likelyValidity?: string;
      reasoning?: string;
      missingEvidence?: string[];
      safeConfirmationSteps?: string[];
      impactExplanation?: string;
      possibleSeverity?: string;
      programRuleConcerns?: string[];
      reportTitleSuggestion?: string;
      recommendedEvidence?: string[];
    }

    const data = safeParseJson<ValidationResult>(raw);
    const aiValidation = data ? JSON.stringify(data, null, 2) : raw;

    await prisma.finding.update({
      where: { id: findingId },
      data: { aiValidation },
    });

    return NextResponse.json({ aiValidation: data ?? raw });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ollama is not responding', details: message },
      { status: 503 }
    );
  }
}
