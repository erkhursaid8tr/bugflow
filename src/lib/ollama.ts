// ─────────────────────────────────────────────────────────────────────────────
// Ollama local API integration
// Calls the locally-running Ollama instance. No external network calls.
// ─────────────────────────────────────────────────────────────────────────────

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaOptions {
  temperature?: number;
  num_predict?: number;
}

export interface OllamaResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
}

// Central safety-focused system prompt prepended to every AI call
export const BUGFLOW_SYSTEM_PROMPT = `You are BugFlow Local AI, a safe bug bounty and authorized penetration testing workflow assistant.

You help the user plan, organize, understand, and document authorized security testing.

You may help with:
- Understanding bug bounty scope
- Summarizing in-scope and out-of-scope assets
- Creating step-by-step testing roadmaps
- Explaining web, API, and mobile testing concepts
- Reviewing pasted recon notes
- Prioritizing safe manual testing tasks
- Helping validate whether a finding may be reportable
- Writing professional vulnerability reports
- Teaching beginner-friendly security concepts

You must NOT:
- Help attack systems without authorization
- Provide destructive exploitation steps
- Provide malware, persistence, evasion, or credential theft guidance
- Provide denial-of-service instructions
- Encourage brute force, credential stuffing, or high-volume scanning
- Suggest accessing or modifying real user data
- Suggest bypassing program restrictions
- Generate harmful payload chains intended for abuse

Always keep the user within the written scope and rules of the bug bounty program.

When unsure:
- Ask the user to verify scope
- Recommend safe manual validation only
- Recommend using only the user's own test accounts and test data
- Recommend stopping if unexpected sensitive data appears`;

function getAiEndpoint(forceLocal: boolean): string {
  if (!forceLocal && process.env.OPENROUTER_API_KEY && process.env.USE_OPENROUTER !== 'false') {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
  return (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') + '/api/chat';
}

function getAiModel(forceLocal: boolean): string {
  if (!forceLocal && process.env.OPENROUTER_API_KEY && process.env.USE_OPENROUTER !== 'false') {
    return process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-coder-32b-instruct';
  }
  return process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
}

/**
 * Send a chat request to the configured AI provider.
 * Always prepends the BugFlow safety system prompt.
 */
export async function askOllama(
  messages: OllamaMessage[],
  options: OllamaOptions = {},
  forceLocal: boolean = false
): Promise<string> {
  const endpoint = getAiEndpoint(forceLocal);
  const model = getAiModel(forceLocal);
  const isOpenRouter = !forceLocal && !!process.env.OPENROUTER_API_KEY && process.env.USE_OPENROUTER !== 'false';

  const allMessages: OllamaMessage[] = [
    { role: 'system', content: BUGFLOW_SYSTEM_PROMPT },
    ...messages,
  ];

  let body: any;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (isOpenRouter) {
    body = {
      model,
      messages: allMessages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.num_predict ?? 2048,
    };
    headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'BugFlow';
  } else {
    body = {
      model,
      messages: allMessages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.num_predict ?? 2048,
      },
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    // Generous timeout for large generations (5 min)
    signal: AbortSignal.timeout(300_000),
  });

  if (!response.ok) {
    // OpenRouter 402 Payment Required = Insufficient Balance
    if (isOpenRouter && response.status === 402) {
      console.warn('OpenRouter balance is empty. Falling back to local Ollama...');
      return askOllama(messages, options, true);
    }
    const text = await response.text();
    throw new Error(`AI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  
  if (isOpenRouter) {
    return data.choices?.[0]?.message?.content ?? '';
  } else {
    return (data as OllamaResponse).message?.content ?? '';
  }
}

/**
 * Test whether the AI provider is reachable.
 */
export async function testOllamaConnection(): Promise<{
  success: boolean;
  model: string;
  message: string;
}> {
  const model = getAiModel(false);
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.USE_OPENROUTER !== 'false';
  try {
    const result = await askOllama(
      [{ role: 'user', content: 'Reply with exactly: OK' }],
      { temperature: 0, num_predict: 10 }
    );
    return {
      success: true,
      model,
      message: `Connected via ${isOpenRouter ? 'OpenRouter' : 'Ollama'}. Model responded: "${result.trim()}"`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      model,
      message: `Cannot reach AI provider. Error: ${message}`,
    };
  }
}

export function getConfiguredModel(): string {
  return getAiModel(false);
}
