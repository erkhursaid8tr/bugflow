interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 opacity-30" style={{ color: 'var(--text-muted)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
