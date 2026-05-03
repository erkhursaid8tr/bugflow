'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'var(--text-muted)' },
  { value: 'ACTIVE', label: 'Active', color: 'var(--green)' },
  { value: 'PAUSED', label: 'Paused', color: 'var(--yellow)' },
  { value: 'COMPLETED', label: 'Completed', color: 'var(--accent)' },
  { value: 'ARCHIVED', label: 'Archived', color: 'var(--text-muted)' },
];

interface Props {
  programId: string;
  currentStatus: string;
}

export default function ProgramStatusSelector({ programId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const currentColor = STATUSES.find((s) => s.value === status)?.color ?? 'var(--text-muted)';

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {saving && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="rounded-full px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
        style={{
          background: 'var(--bg-base)',
          border: `1px solid ${currentColor}`,
          color: currentColor,
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
