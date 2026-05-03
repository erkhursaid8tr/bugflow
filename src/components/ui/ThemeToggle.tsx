'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('bugflow-theme') as 'dark' | 'light' | null;
    const initial = stored || 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bugflow-theme', next);
  }

  // Prevent hydration mismatch — render nothing until mounted
  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex items-center justify-center h-9 w-9 rounded-lg transition-all hover:scale-105 active:scale-95"
      style={{
        background: theme === 'dark'
          ? 'rgba(251, 191, 36, 0.1)'
          : 'rgba(99, 102, 241, 0.1)',
        border: `1px solid ${theme === 'dark'
          ? 'rgba(251, 191, 36, 0.25)'
          : 'rgba(99, 102, 241, 0.25)'}`,
        color: theme === 'dark' ? '#fbbf24' : '#6366f1',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
