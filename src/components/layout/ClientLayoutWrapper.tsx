'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Menu, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAuthPage = pathname === '/login';

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [pathname, isMobile]);

  if (!mounted) return null; // Prevent hydration mismatch

  if (isAuthPage) {
    return (
      <main className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden md:overflow-visible">
      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4" 
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <ShieldCheck size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>BugFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setIsOpen(true)}>
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Desktop Floating Toggle Button (visible when sidebar is closed) */}
      {!isOpen && !isMobile && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg transition-all hover:scale-105 shadow-sm"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <Menu size={20} />
        </button>
      )}

      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <main 
        className={`flex-1 min-h-screen transition-all duration-300 w-full ${isOpen && !isMobile ? 'md:ml-60' : 'ml-0'} mt-14 md:mt-0`} 
        style={{ background: 'var(--bg-base)' }}
      >
        {children}
      </main>
    </div>
  );
}
