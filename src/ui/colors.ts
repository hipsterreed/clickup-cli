import chalk from 'chalk';

export function statusColor(status: string, color?: string): string {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('closed')) {
    return chalk.green(status);
  }
  if (s.includes('progress') || s.includes('active') || s.includes('open')) {
    return chalk.blue(status);
  }
  if (s.includes('review') || s.includes('testing') || s.includes('qa')) {
    return chalk.yellow(status);
  }
  if (s.includes('block') || s.includes('urgent') || s.includes('hold')) {
    return chalk.red(status);
  }
  if (s.includes('todo') || s.includes('to do') || s.includes('backlog')) {
    return chalk.gray(status);
  }
  // Use the API color if available
  if (color) {
    return chalk.hex(color)(status);
  }
  return chalk.white(status);
}

export function statusDot(status: string, color?: string): string {
  const s = status.toLowerCase();
  const dot = '●';
  if (s.includes('done') || s.includes('complete') || s.includes('closed')) {
    return chalk.green(dot);
  }
  if (s.includes('progress') || s.includes('active')) {
    return chalk.blue(dot);
  }
  if (s.includes('review') || s.includes('testing') || s.includes('qa')) {
    return chalk.yellow(dot);
  }
  if (s.includes('block') || s.includes('hold')) {
    return chalk.red(dot);
  }
  if (color) {
    try {
      return chalk.hex(color)(dot);
    } catch {
      return chalk.gray(dot);
    }
  }
  return chalk.gray(dot);
}

export function priorityColor(id?: string, label?: string): string {
  const text = label ?? priorityLabelFromId(id);
  switch (id) {
    case '1': return chalk.bgRed.white(` ${text} `);
    case '2': return chalk.red(text);
    case '3': return chalk.yellow(text);
    case '4': return chalk.gray(text);
    default: return chalk.gray('—');
  }
}

export function priorityColorInk(id?: string): { color: string; bgColor?: string } {
  switch (id) {
    case '1': return { color: 'white', bgColor: 'red' };
    case '2': return { color: 'red' };
    case '3': return { color: 'yellow' };
    case '4': return { color: 'gray' };
    default: return { color: 'gray' };
  }
}

export function priorityLabelFromId(id?: string): string {
  switch (id) {
    case '1': return 'urgent';
    case '2': return 'high';
    case '3': return 'normal';
    case '4': return 'low';
    default: return '—';
  }
}

export function statusColorInk(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('complete') || s.includes('closed')) return 'green';
  if (s.includes('progress') || s.includes('active')) return 'blue';
  if (s.includes('review') || s.includes('testing') || s.includes('qa')) return 'yellow';
  if (s.includes('block') || s.includes('hold')) return 'red';
  return 'gray';
}
