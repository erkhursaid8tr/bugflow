import { NextResponse } from 'next/server';

export async function GET() {
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.USE_OPENROUTER !== 'false';
  
  return NextResponse.json({
    provider: isOpenRouter ? 'OpenRouter' : 'Ollama',
    url: isOpenRouter 
      ? 'https://openrouter.ai/api/v1/chat/completions' 
      : (process.env.OLLAMA_BASE_URL || 'http://localhost:11434'),
    model: isOpenRouter 
      ? (process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-coder-32b-instruct') 
      : (process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b'),
  });
}
