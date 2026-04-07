export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

export function formatDate(unixMs?: string | null): string {
  if (!unixMs) return '—';
  const ms = parseInt(unixMs, 10);
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(unixMs?: string | null): string {
  if (!unixMs) return '—';
  const ms = parseInt(unixMs, 10);
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelative(unixMs?: string | null): string {
  if (!unixMs) return '';
  const ms = parseInt(unixMs, 10);
  if (isNaN(ms)) return '';
  const diff = ms - Date.now();
  const absDiff = Math.abs(diff);
  const days = Math.round(absDiff / 86400000);

  if (diff < 0) {
    if (days === 0) return '(today)';
    return `(${days}d overdue)`;
  }
  if (days === 0) return '(today)';
  if (days === 1) return '(tomorrow)';
  return `(${days} days)`;
}

export function priorityLabel(id?: string): string {
  switch (id) {
    case '1': return 'urgent';
    case '2': return 'high';
    case '3': return 'normal';
    case '4': return 'low';
    default: return '—';
  }
}

export function formatCommentDate(unixMs: string): string {
  const ms = parseInt(unixMs, 10);
  if (isNaN(ms)) return '';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function padEnd(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}
