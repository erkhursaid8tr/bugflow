import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askOllama } from '@/lib/ollama';
import { buildLearningPrompt } from '@/lib/ai-prompts';

// POST /api/ai/learning — answer a learning question
export async function POST(req: NextRequest) {
  const { question, conversationId, history } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  // Build message history for context-aware conversation
  const messages = [
    ...(history || []),
    ...buildLearningPrompt(question),
  ];

  try {
    const answer = await askOllama(messages);

    // Persist to conversation if an ID was provided
    if (conversationId) {
      await prisma.aiMessage.createMany({
        data: [
          { conversationId, role: 'user', content: question },
          { conversationId, role: 'assistant', content: answer },
        ],
      });
    }

    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ollama is not responding', details: message },
      { status: 503 }
    );
  }
}
