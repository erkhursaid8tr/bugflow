'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Map,
  ScanSearch,
  Bug,
  FileText,
  BookOpen,
  Settings,
  CalendarDays,
  ShieldCheck,
  PanelLeftClose,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/programs', label: 'Programs', icon: FolderKanban },
  { href: '/targets', label: 'All Targets', icon: Target },
  { href: '/findings', label: 'All Findings', icon: Bug },
  { href: '/logs', label: 'Daily Logs', icon: CalendarDays },
  { href: '/learning', label: 'Learning', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo + theme toggle */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              BugFlow
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Local AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block"><ThemeToggle /></div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:opacity-80 transition-opacity" title="Toggle Sidebar">
              <PanelLeftClose size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(href)
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={
              isActive(href)
                ? {
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(124,58,237,0.15))',
                    color: 'var(--accent)',
                    border: '1px solid rgba(56,189,248,0.2)',
                  }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Safety badge */}
      <div className="mx-3 mb-4 rounded-lg px-3 py-2.5"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>
          ⚠ Authorized testing only
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Stay within program scope
        </p>
      </div>
    </aside>
  );
}
