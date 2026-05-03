import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildSinglePhasePrompt } from '@/lib/ai-prompts';
import { safeParseJson } from '@/lib/utils';

export const maxDuration = 300; // Vercel Hobby max is 300s (5 minutes)

type RouteParams = { params: Promise<{ phaseId: string }> };

// POST /api/roadmap/phases/[phaseId]/generate
// Generates detailed AI content for a single roadmap phase
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { phaseId } = await params;

  // Fetch the phase and its program
  const phase = await prisma.roadmapPhase.findUnique({
    where: { id: phaseId },
    include: { program: true },
  });

  if (!phase) {
    return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
  }

  const force = req.nextUrl.searchParams.get('force') === 'true';

  if (phase.isGenerated && !force) {
    return NextResponse.json({ error: 'Phase already generated' }, { status: 400 });
  }

  const program = phase.program;

  try {
    // ── Build context from previous phases ────────────────────────────────
    const allPhases = await prisma.roadmapPhase.findMany({
      where: { programId: program.id },
      orderBy: { order: 'asc' },
      include: { tasks: true },
    });

    // Summarize completed phases
    const completedSummaries = allPhases
      .filter((p) => (p.status === 'DONE' || p.status === 'SKIPPED') && p.order < phase.order)
      .map((p) => {
        const tasksSummary = p.tasks
          .filter((t) => t.status === 'DONE')
          .map((t) => t.title)
          .join(', ');
        return `- Phase ${p.order + 1} (${p.title}): ${p.status}${tasksSummary ? `. Completed: ${tasksSummary}` : ''}${p.userNotes ? `. Notes: ${p.userNotes}` : ''}`;
      })
      .join('\n');

    // Recent findings for this program
    const findings = await prisma.finding.findMany({
      where: { programId: program.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const findingsSummary = findings
      .map((f) => `- [${f.severity}] ${f.title}: ${f.description.slice(0, 100)}${f.description.length > 100 ? '...' : ''}`)
      .join('\n');

    // Recent recon notes for this program
    const reconNotes = await prisma.reconNote.findMany({
      where: { programId: program.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const reconSummary = reconNotes
      .map((r) => `- [${r.toolName}] ${r.title}: ${r.aiSummary.slice(0, 100)}${r.aiSummary.length > 100 ? '...' : ''}`)
      .join('\n');

    // ── Call Ollama for this single phase ─────────────────────────────────
    const messages = buildSinglePhasePrompt({
      programName: program.name,
      inScope: program.inScope,
      outOfScope: program.outOfScope,
      allowedTesting: program.allowedTesting,
      forbiddenTesting: program.forbiddenTesting,
      rawProgramText: program.rawProgramText,
      phaseNumber: phase.order + 1,
      phaseTitle: phase.title,
      completedPhaseSummaries: completedSummaries,
      recentFindings: findingsSummary,
      recentReconNotes: reconSummary,
    });

    const raw = await askOllama(messages, { num_predict: 2048 });

    interface PhaseResult {
      priority?: string;
      goal?: string;
      whyItMatters?: string;
      manualApproach?: string;
      recommendedTools?: string;
      inputsToCollect?: string;
      whatToLookFor?: string;
      possibleBugClasses?: string;
      safeValidationSteps?: string;
      notesToSave?: string;
      completionCriteria?: string;
      safetyWarnings?: string;
      aiQuestions?: string;
      tasks?: TaskResult[];
    }
    interface TaskResult {
      title: string;
      description?: string;
      stepByStepGuide?: string[];
      commands?: string[];
      suggestedTools?: string;
      expectedOutput?: string;
      possibleBugClasses?: string;
      safetyNotes?: string;
      completionCriteria?: string;
    }

    const data = safeParseJson<PhaseResult>(raw);
    const stringify = (v: unknown) =>
      Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : '';

    if (data) {
      // ── Update phase with generated content ──────────────────────────
      await prisma.roadmapPhase.update({
        where: { id: phaseId },
        data: {
          isGenerated: true,
          status: phase.status === 'LOCKED' ? 'TODO' : phase.status,
          priority: data.priority || phase.priority,
          goal: stringify(data.goal),
          whyItMatters: stringify(data.whyItMatters),
          manualApproach: stringify(data.manualApproach),
          recommendedTools: stringify(data.recommendedTools),
          inputsToCollect: stringify(data.inputsToCollect),
          whatToLookFor: stringify(data.whatToLookFor),
          possibleBugClasses: stringify(data.possibleBugClasses),
          safeValidationSteps: stringify(data.safeValidationSteps),
          notesToSave: stringify(data.notesToSave),
          completionCriteria: stringify(data.completionCriteria),
          safetyWarnings: stringify(data.safetyWarnings),
          aiQuestions: stringify(data.aiQuestions),
        },
      });

      // ── Create tasks ─────────────────────────────────────────────────
      if (Array.isArray(data.tasks)) {
        // Delete any existing tasks for this phase
        await prisma.roadmapTask.deleteMany({ where: { phaseId } });

        for (let j = 0; j < data.tasks.length; j++) {
          const task = data.tasks[j];
          await prisma.roadmapTask.create({
            data: {
              phaseId,
              title: task.title || `Task ${j + 1}`,
              description: stringify(task.description),
              stepByStepGuide: stringify(task.stepByStepGuide),
              commands: stringify(task.commands),
              suggestedTools: stringify(task.suggestedTools),
              expectedOutput: stringify(task.expectedOutput),
              possibleBugClasses: stringify(task.possibleBugClasses),
              safetyNotes: stringify(task.safetyNotes),
              completionCriteria: stringify(task.completionCriteria),
              order: j,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        phaseTitle: phase.title,
        tasksGenerated: data.tasks?.length ?? 0,
      });
    } else {
      // JSON parse failed — store raw as goal and mark generated
      await prisma.roadmapPhase.update({
        where: { id: phaseId },
        data: {
          isGenerated: true,
          status: phase.status === 'LOCKED' ? 'TODO' : phase.status,
          goal: raw.slice(0, 500),
        },
      });

      return NextResponse.json({
        success: true,
        phaseTitle: phase.title,
        tasksGenerated: 0,
        warning: 'AI returned non-JSON response. Raw content saved as goal.',
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Phase generation failed', details: message },
      { status: 503 }
    );
  }
}
