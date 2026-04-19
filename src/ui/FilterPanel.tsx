import { Box, Text, useInput } from 'ink';
import { useState, useMemo } from 'react';
import type { TaskFilters, ClickUpStatus } from '../types/clickup.js';

interface Props {
  filters: TaskFilters;
  taskStatuses: ClickUpStatus[];
  onApply: (filters: TaskFilters) => void;
  onCancel: () => void;
}

export default function FilterPanel({ filters, taskStatuses, onApply, onCancel }: Props) {
  const [statuses, setStatuses] = useState<Set<string>>(new Set(filters.statuses ?? []));
  const [includeClosed, setIncludeClosed] = useState(filters.includeClosed ?? false);
  const [subtasks, setSubtasks] = useState(filters.subtasks ?? false);
  const [fieldIdx, setFieldIdx] = useState(0);

  const fields = useMemo(() => [
    ...taskStatuses.map((s) => `status:${s.status}`),
    'closed',
    'subtasks',
  ], [taskStatuses]);

  const field = fields[Math.min(fieldIdx, fields.length - 1)];

  function toggleStatus(key: string) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleApply() {
    onApply({
      ...filters,
      statuses: statuses.size > 0 ? [...statuses] : undefined,
      includeClosed,
      subtasks,
    });
  }

  function handleReset() {
    setStatuses(new Set());
    setIncludeClosed(false);
    setSubtasks(false);
    setFieldIdx(0);
  }

  useInput((input, key) => {
    if (key.escape) { onCancel(); return; }
    if (key.return) { handleApply(); return; }
    if (input === 'r') { handleReset(); return; }

    if (key.upArrow) { setFieldIdx((i) => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setFieldIdx((i) => Math.min(fields.length - 1, i + 1)); return; }

    if (input === ' ') {
      if (field.startsWith('status:')) {
        toggleStatus(field.slice(7));
      } else if (field === 'closed') {
        setIncludeClosed((v) => !v);
      } else if (field === 'subtasks') {
        setSubtasks((v) => !v);
      }
    }
  });

  function checkbox(checked: boolean) { return checked ? '[✓]' : '[ ]'; }
  function isField(f: string) { return field === f; }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">Filters</Text>
      <Text color="gray">↑↓ navigate  ·  space toggle  ·  enter apply  ·  r reset  ·  esc cancel</Text>
      <Text> </Text>

      <Text color="gray">  Status</Text>
      {taskStatuses.map((s) => {
        const f = `status:${s.status}`;
        return (
          <Box key={f}>
            <Text color={isField(f) ? 'cyan' : 'gray'} bold={isField(f)}>
              {isField(f) ? '▶ ' : '  '}
            </Text>
            <Text color={statuses.has(s.status) ? 'white' : 'gray'}>
              {checkbox(statuses.has(s.status))} {s.status}
            </Text>
          </Box>
        );
      })}

      <Text> </Text>

      <Box>
        <Text color={isField('closed') ? 'cyan' : 'gray'} bold={isField('closed')}>
          {isField('closed') ? '▶ ' : '  '}
        </Text>
        <Text color={includeClosed ? 'white' : 'gray'}>{checkbox(includeClosed)} include closed</Text>
      </Box>
      <Box>
        <Text color={isField('subtasks') ? 'cyan' : 'gray'} bold={isField('subtasks')}>
          {isField('subtasks') ? '▶ ' : '  '}
        </Text>
        <Text color={subtasks ? 'white' : 'gray'}>{checkbox(subtasks)} include subtasks</Text>
      </Box>

      <Text> </Text>
      <Text color="gray">  enter apply  ·  r reset</Text>
    </Box>
  );
}
