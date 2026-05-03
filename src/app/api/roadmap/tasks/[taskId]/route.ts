import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { taskId } = await params;
  const body = await req.json();

  // First fetch the task to get phase and program details
  const existingTask = await prisma.roadmapTask.findUnique({
    where: { id: taskId },
    include: { phase: true },
  });

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Update the task
  const task = await prisma.roadmapTask.update({
    where: { id: taskId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  // If the user added/updated notes, log it to today's Daily Log
  if (body.notes !== undefined && body.notes.trim() !== '') {
    const programId = existingTask.phase.programId;
    
    // Check if there's a daily log for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyLog = await prisma.dailyLog.findFirst({
      where: {
        programId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const logEntry = `\n[Task: ${task.title}]\n${body.notes}`;

    if (dailyLog) {
      // Append to existing log
      await prisma.dailyLog.update({
        where: { id: dailyLog.id },
        data: {
          notes: dailyLog.notes ? dailyLog.notes + '\n' + logEntry : logEntry,
        },
      });
    } else {
      // Create new daily log
      await prisma.dailyLog.create({
        data: {
          programId,
          date: new Date(),
          notes: logEntry,
        },
      });
    }
  }

  return NextResponse.json(task);
}
