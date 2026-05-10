import { Lightbulb } from 'lucide-react';

interface GuidanceBannerProps {
  title: string;
  description: string;
  steps?: string[];
}

export default function GuidanceBanner({ title, description, steps }: GuidanceBannerProps) {
  return (
    <div
      className="rounded-xl px-5 py-4 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(124,58,237,0.06))',
        border: '1px solid rgba(56,189,248,0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 mt-0.5 flex items-center justify-center rounded-lg h-7 w-7"
          style={{ background: 'rgba(56,189,248,0.12)' }}
        >
          <Lightbulb size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
          {steps && steps.length > 0 && (
            <ol className="mt-2.5 space-y-1">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span
                    className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold h-4 w-4 mt-0.5"
                    style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
