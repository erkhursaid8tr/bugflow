import { statusColor, statusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusColor(status);
  const label = statusLabel(status);
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${px} ${colorClass}`}
    >
      {label}
    </span>
  );
}
