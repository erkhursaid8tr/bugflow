'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  endpoint: string;
  itemName: string;
  redirectUrl?: string;
  variant?: 'icon' | 'button';
  buttonText?: string;
}

export default function DeleteButton({
  endpoint,
  itemName,
  redirectUrl,
  variant = 'icon',
  buttonText = 'Delete',
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${itemName}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${itemName}.`);
      setIsDeleting(false);
    }
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
        title={`Delete ${itemName}`}
      >
        {isDeleting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
        {buttonText}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50"
      style={{
        color: 'var(--text-muted)',
        background: 'transparent',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.color = '#ef4444';
        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'transparent';
      }}
      title={`Delete ${itemName}`}
    >
      {isDeleting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
