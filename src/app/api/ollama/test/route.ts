import { NextResponse } from 'next/server';
import { testOllamaConnection } from '@/lib/ollama';

export async function GET() {
  const result = await testOllamaConnection();
  return NextResponse.json(result, { status: result.success ? 200 : 503 });
}
