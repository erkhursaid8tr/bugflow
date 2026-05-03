// Utility helpers used across the app

/**
 * Safely parse JSON from Ollama responses.
 * Ollama sometimes wraps JSON in markdown fences — this strips them.
 */
export function safeParseJson<T>(raw: string): T | null {
  try {
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find the first { ... } or [ ... ] block
    const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime for display.
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return a Tailwind color class for a severity level.
 */
export function severityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-400 bg-red-400/10 border-red-400/30';
    case 'HIGH':
      return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    case 'MEDIUM':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    case 'LOW':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    case 'INFORMATIONAL':
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }
}

/**
 * Return a Tailwind color class for a program/target status.
 */
export function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'CONFIRMED':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    case 'PAUSED':
    case 'INTERESTING':
    case 'NEEDS_MORE_EVIDENCE':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    case 'COMPLETED':
    case 'DONE':
    case 'PAID':
      return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
    case 'ARCHIVED':
    case 'SKIPPED':
    case 'REJECTED':
    case 'DUPLICATE':
    case 'FIXED':
      return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    case 'NOT_STARTED':
    case 'TODO':
    case 'IDEA':
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    case 'REPORTED':
    case 'REPORT_DRAFTED':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }
}

/**
 * Human-readable status labels.
 */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    SKIPPED: 'Skipped',
    IDEA: 'Idea',
    TESTING: 'Testing',
    INTERESTING: 'Interesting',
    NEEDS_MORE_EVIDENCE: 'Needs Evidence',
    CONFIRMED: 'Confirmed',
    REPORT_DRAFTED: 'Draft Ready',
    REPORTED: 'Reported',
    DUPLICATE: 'Duplicate',
    INFORMATIVE: 'Informative',
    REJECTED: 'Rejected',
    FIXED: 'Fixed',
    PAID: 'Paid',
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    ACCEPTED: 'Accepted',
  };
  return labels[status] || status;
}

/**
 * Truncate text for display in cards.
 */
export function truncate(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Platform badge color.
 */
export function platformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'hackerone':
      return 'text-green-400 bg-green-400/10 border-green-400/30';
    case 'bugcrowd':
      return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    case 'intigriti':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
    case 'yeswehack':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }
}
