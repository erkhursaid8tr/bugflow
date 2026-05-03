interface AiLoadingStateProps {
  message?: string;
}

export default function AiLoadingState({ message = 'Thinking with AI…' }: AiLoadingStateProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-5 py-4"
      style={{
        background: 'rgba(56,189,248,0.06)',
        border: '1px solid rgba(56,189,248,0.2)',
      }}
    >
      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full ai-loading"
            style={{
              background: 'var(--accent)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <p className="text-sm" style={{ color: 'var(--accent)' }}>
        {message}
      </p>
    </div>
  );
}
