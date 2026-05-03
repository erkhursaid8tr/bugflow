import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: programId } = await params;

    // Fetch all phases for this program
    const phases = await prisma.roadmapPhase.findMany({
      where: { programId },
      orderBy: { order: 'asc' },
    });

    if (!phases.length) {
      return NextResponse.json({ error: 'No roadmap found for this program' }, { status: 404 });
    }

    // Delete all tasks for these phases
    await prisma.roadmapTask.deleteMany({
      where: {
        phaseId: { in: phases.map(p => p.id) }
      }
    });

    // Reset all phases to their skeleton state
    for (let i = 0; i < phases.length; i++) {
      await prisma.roadmapPhase.update({
        where: { id: phases[i].id },
        data: {
          isGenerated: false,
          status: i === 0 ? 'TODO' : 'LOCKED',
          priority: 'MEDIUM',
          goal: '',
          whyItMatters: '',
          manualApproach: '',
          recommendedTools: '',
          whatToLookFor: '',
          possibleBugClasses: '',
          safetyWarnings: '',
          completionCriteria: '',
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Roadmap reset error:', error);
    return NextResponse.json({ error: 'Failed to reset roadmap' }, { status: 500 });
  }
}
