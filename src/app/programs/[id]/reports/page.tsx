'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Plus, Loader2, Sparkles, Copy, Download, Check,
  ChevronDown, ChevronUp, Edit2, Trash2,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AiLoadingState from '@/components/ui/AiLoadingState';
import { formatDateTime, statusLabel } from '@/lib/utils';

interface Finding {
  id: string;
  title: string;
  severity: string;
  status: string;
}

interface Report {
  id: string;
  findingId: string;
  title: string;
  style: string;
  content: string;
  status: string;
  outcomeNotes: string;
  createdAt: string;
  updatedAt: string;
  finding?: Finding;
}

const STYLES = [
  { value: 'HACKERONE', label: 'HackerOne Style' },
  { value: 'BUGCROWD', label: 'Bugcrowd Style' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'SHORT', label: 'Short Summary' },
];

const REPORT_STATUSES = ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'DUPLICATE', 'PAID'];

export default function ReportsPage() {
  const { id: programId } = useParams<{ id: string }>();
  const [reports, setReports] = useState<Report[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('PROFESSIONAL');
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/findings?programId=${programId}`).then((r) => r.json()),
    ]).then(([f]) => {
      setFindings(f);
      // Fetch reports for each finding
      const confirmedFindings = f.filter(
        (fi: Finding) => ['CONFIRMED', 'REPORT_DRAFTED', 'REPORTED', 'PAID'].includes(fi.status)
      );
      if (confirmedFindings.length > 0) {
        // Load all reports
        Promise.all(
          confirmedFindings.map((fi: Finding) =>
            fetch(`/api/reports?findingId=${fi.id}`).then((r) => r.json())
          )
        ).then((results) => {
          const allReports = results.flat().map((r: Report, _: number, arr: Report[]) => ({
            ...r,
            finding: f.find((fi: Finding) => fi.id === r.findingId),
          }));
          // Deduplicate by id
          const unique = Array.from(new Map(allReports.map((r: Report) => [r.id, r])).values());
          setReports(unique as Report[]);
        });
      }
    }).finally(() => setLoading(false));
  }, [programId]);

  async function generateReport() {
    if (!selectedFinding) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: selectedFinding, style: selectedStyle }),
      });
      const report = await res.json();
      report.finding = findings.find((f) => f.id === selectedFinding);
      setReports((prev) => [report, ...prev]);
      setShowGenerator(false);
      setExpanded(report.id);
    } finally {
      setGenerating(false);
    }
  }

  async function saveEdit(reportId: string) {
    await fetch(`/api/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, content: editContent } : r)));
    setEditing(null);
  }

  async function updateStatus(reportId: string, status: string) {
    await fetch(`/api/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
  }

  async function deleteReport(reportId: string) {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  function copyToClipboard(reportId: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopied(reportId);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadMarkdown(title: string, content: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
  };

  const confirmableFindings = findings.filter(
    (f) => ['CONFIRMED', 'REPORT_DRAFTED', 'INTERESTING', 'NEEDS_MORE_EVIDENCE', 'TESTING'].includes(f.status)
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href={`/programs/${programId}`} className="text-xs hover:opacity-80 mb-1 block"
            style={{ color: 'var(--text-muted)' }}>← Program Overview</Link>
          <h1 className="flex items-center gap-2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <FileText size={20} /> Reports
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Generate professional vulnerability reports from confirmed findings
          </p>
        </div>
        <button onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
          <Sparkles size={15} /> Generate Report
        </button>
      </div>

      {/* Report generator */}
      {showGenerator && (
        <div className="mb-6 rounded-xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Generate Report from Finding
          </h2>
          {confirmableFindings.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No findings ready for report generation. Add findings first and set them to Testing or Confirmed.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Select Finding
                  </label>
                  <select style={inputStyle} value={selectedFinding}
                    onChange={(e) => setSelectedFinding(e.target.value)}>
                    <option value="">Choose a finding…</option>
                    {confirmableFindings.map((f) => (
                      <option key={f.id} value={f.id}>[{f.severity}] {f.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Report Style
                  </label>
                  <select style={inputStyle} value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}>
                    {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={generateReport} disabled={generating || !selectedFinding}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? 'Generating…' : 'Generate with AI'}
                </button>
                <button onClick={() => setShowGenerator(false)}
                  className="rounded-lg px-4 py-2.5 text-sm"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
          {generating && <AiLoadingState message="AI is generating your vulnerability report…" />}
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : reports.length === 0 && !showGenerator ? (
        <EmptyState title="No reports yet"
          description="Generate a professional vulnerability report from a confirmed finding."
          icon={<FileText size={48} />}
          action={<button onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
            <Sparkles size={14} /> Generate Report
          </button>} />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isOpen = expanded === report.id;
            const isEditing = editing === report.id;
            return (
              <div key={report.id} className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Header */}
                <button className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  onClick={() => { setExpanded(isOpen ? null : report.id); setEditing(null); }}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {report.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {report.style} · {formatDateTime(report.createdAt)}
                      {report.finding && ` · ${report.finding.title}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select value={report.status} onChange={(e) => updateStatus(report.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {REPORT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                    <button onClick={() => deleteReport(report.id)} className="hover:opacity-80 p-1">
                      <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>

                {/* Content */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} className="p-5 space-y-4">
                    {/* Action bar */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => copyToClipboard(report.id, report.content)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: copied === report.id ? '#34d399' : 'var(--text-secondary)' }}>
                        {copied === report.id ? <Check size={12} /> : <Copy size={12} />}
                        {copied === report.id ? 'Copied!' : 'Copy Markdown'}
                      </button>
                      <button onClick={() => downloadMarkdown(report.title, report.content)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <Download size={12} /> Download .md
                      </button>
                      <button onClick={() => { setEditing(isEditing ? null : report.id); setEditContent(report.content); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                        style={{ background: isEditing ? 'rgba(56,189,248,0.1)' : 'var(--bg-base)', border: `1px solid ${isEditing ? 'rgba(56,189,248,0.3)' : 'var(--border)'}`, color: isEditing ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        <Edit2 size={12} /> {isEditing ? 'Cancel Edit' : 'Edit'}
                      </button>
                    </div>

                    {/* Report content */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={25}
                          className="w-full rounded-lg p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', resize: 'vertical' }}
                        />
                        <button onClick={() => saveEdit(report.id)}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                          style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}>
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg p-5 prose-dark text-sm whitespace-pre-wrap leading-relaxed"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        {report.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
