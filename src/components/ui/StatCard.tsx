interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: string;
  sublabel?: string;
}

export default function StatCard({ label, value, icon, accent = '#38bdf8', sublabel }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {icon && (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
