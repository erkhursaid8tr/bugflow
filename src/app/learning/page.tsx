'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_QUESTIONS = [
  'What is IDOR / BOLA?',
  'How do I test authorization safely?',
  'What makes a good bug bounty report?',
  'What is the difference between authentication and authorization?',
  'How do I approach API security testing?',
  'What evidence should I collect for a finding?',
  'What does severity mean in bug bounty?',
  'How do I find business logic bugs?',
];

export default function LearningPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    setError('');

    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'AI did not respond');
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Learning Assistant
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Powered by BugFlow AI · Beginner-friendly bug bounty knowledge
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-opacity hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ask anything about bug bounty, security testing, or report writing
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left rounded-xl px-4 py-3 text-sm transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(124,58,237,0.2))',
                      border: '1px solid rgba(56,189,248,0.3)',
                      color: 'var(--text-primary)',
                    }
                  : {
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose-dark whitespace-pre-wrap">{msg.content}</div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl px-5 py-3.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Thinking with AI…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-8 py-5"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a bug bounty question…"
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <p className="mt-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          All responses are processed by your configured AI provider.
        </p>
      </div>
    </div>
  );
}
