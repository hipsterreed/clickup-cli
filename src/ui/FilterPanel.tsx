import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import type { TaskFilters, ClickUpList, ClickUpSpace } from '../types/clickup.js';

type Scope = 'me' | 'list' | 'all';

interface Props {
  filters: TaskFilters;
  lists: ClickUpList[];
  spaces: ClickUpSpace[];
  onApply: (filters: TaskFilters) => void;
  onCancel: () => void;
}

type Field = 'scope' | 'list' | 'status_todo' | 'status_inprogress' | 'status_review' | 'status_done' | 'priority_urgent' | 'priority_high' | 'priority_normal' | 'priority_low' | 'closed' | 'subtasks' | 'apply' | 'reset';

const FIELDS: Field[] = [
  'scope', 'list',
  'status_todo', 'status_inprogress', 'status_review', 'status_done',
  'priority_urgent', 'priority_high', 'priority_normal', 'priority_low',
  'closed', 'subtasks',
  'apply', 'reset',
];

export default function FilterPanel({ filters, lists, onApply, onCancel }: Props) {
  const [scope, setScope] = useState<Scope>(
    filters.me ? 'me' : filters.listId ? 'list' : 'all',
  );
  const [listIdx, setListIdx] = useState(() => {
    if (!filters.listId) return 0;
    const i = lists.findIndex((l) => l.id === filters.listId);
    return i >= 0 ? i : 0;
  });
  const [statuses, setStatuses] = useState<Set<string>>(
    new Set(filters.statuses ?? []),
  );
  const [priorities, setPriorities] = useState<Set<string>>(
    new Set(filters.priorities ?? []),
  );
  const [includeClosed, setIncludeClosed] = useState(filters.includeClosed ?? false);
  const [subtasks, setSubtasks] = useState(filters.subtasks ?? false);
  const [fieldIdx, setFieldIdx] = useState(0);

  useInput((input, key) => {
    const field = FIELDS[fieldIdx];

    if (key.escape) { onCancel(); return; }

    if (key.upArrow) {
      setFieldIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
      return;
    }

    if (key.return || input === ' ') {
      switch (field) {
        case 'scope':
          setScope((s) => s === 'me' ? 'list' : s === 'list' ? 'all' : 'me');
          break;
        case 'list':
          if (scope === 'list') setListIdx((i) => (i + 1) % lists.length);
          break;
        case 'status_todo': toggleStatus('to do'); break;
        case 'status_inprogress': toggleStatus('in progress'); break;
        case 'status_review': toggleStatus('in review'); break;
        case 'status_done': toggleStatus('done'); break;
        case 'priority_urgent': togglePriority('1'); break;
        case 'priority_high': togglePriority('2'); break;
        case 'priority_normal': togglePriority('3'); break;
        case 'priority_low': togglePriority('4'); break;
        case 'closed': setIncludeClosed((v) => !v); break;
        case 'subtasks': setSubtasks((v) => !v); break;
        case 'apply': handleApply(); break;
        case 'reset': handleReset(); break;
      }
    }

    // Left/right for scope
    if (field === 'scope') {
      if (key.leftArrow) setScope((s) => s === 'me' ? 'all' : s === 'list' ? 'me' : 'list');
      if (key.rightArrow) setScope((s) => s === 'me' ? 'list' : s === 'list' ? 'all' : 'me');
    }
    if (field === 'list' && scope === 'list') {
      if (key.leftArrow) setListIdx((i) => Math.max(0, i - 1));
      if (key.rightArrow) setListIdx((i) => Math.min(lists.length - 1, i + 1));
    }
  });

  function toggleStatus(s: string) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function togglePriority(p: string) {
    setPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  function handleApply() {
    onApply({
      me: scope === 'me',
      listId: scope === 'list' && lists[listIdx] ? lists[listIdx].id : undefined,
      statuses: statuses.size > 0 ? [...statuses] : undefined,
      priorities: priorities.size > 0 ? [...priorities] : undefined,
      includeClosed,
      subtasks,
    });
  }

  function handleReset() {
    setScope('me');
    setStatuses(new Set());
    setPriorities(new Set());
    setIncludeClosed(false);
    setSubtasks(false);
  }

  function isActive(field: Field) { return FIELDS[fieldIdx] === field; }
  function checkbox(checked: boolean) { return checked ? '[✓]' : '[ ]'; }
  function radio(value: string, current: string) { return value === current ? '●' : '○'; }

  const selectedList = lists[listIdx];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">Filters</Text>
      <Text color="gray" dimColor>↑↓ navigate  ·  space/enter toggle  ·  esc cancel</Text>
      <Text> </Text>

      {/* Scope */}
      <Box>
        <Text color={isActive('scope') ? 'cyan' : 'gray'} bold={isActive('scope')}>
          {isActive('scope') ? '▶ ' : '  '}Scope    {'  '}
        </Text>
        <Text color={scope === 'me' ? 'cyan' : 'gray'}>{radio('me', scope)} My tasks  </Text>
        <Text color={scope === 'list' ? 'cyan' : 'gray'}>{radio('list', scope)} List  </Text>
        <Text color={scope === 'all' ? 'cyan' : 'gray'}>{radio('all', scope)} All team</Text>
      </Box>

      {/* List selector */}
      {scope === 'list' && (
        <Box>
          <Text color={isActive('list') ? 'cyan' : 'gray'} bold={isActive('list')}>
            {isActive('list') ? '▶ ' : '  '}List     {'  '}
          </Text>
          <Text color="white">
            {selectedList ? selectedList.name : 'No lists found'}
          </Text>
          {lists.length > 1 && (
            <Text color="gray" dimColor>  ← → to change</Text>
          )}
        </Box>
      )}

      <Text> </Text>

      {/* Status checkboxes */}
      <Text color="gray" dimColor>  Status</Text>
      {(
        [
          ['status_todo', 'to do', 'to do'],
          ['status_inprogress', 'in progress', 'in progress'],
          ['status_review', 'in review', 'in review'],
          ['status_done', 'done', 'done'],
        ] as [Field, string, string][]
      ).map(([field, label, key]) => (
        <Box key={field}>
          <Text color={isActive(field) ? 'cyan' : 'gray'} bold={isActive(field)}>
            {isActive(field) ? '▶ ' : '  '}
          </Text>
          <Text color={statuses.has(key) ? 'white' : 'gray'}>
            {checkbox(statuses.has(key))} {label}
          </Text>
        </Box>
      ))}

      <Text> </Text>

      {/* Priority checkboxes */}
      <Text color="gray" dimColor>  Priority</Text>
      {(
        [
          ['priority_urgent', 'urgent', '1'],
          ['priority_high', 'high', '2'],
          ['priority_normal', 'normal', '3'],
          ['priority_low', 'low', '4'],
        ] as [Field, string, string][]
      ).map(([field, label, key]) => (
        <Box key={field}>
          <Text color={isActive(field) ? 'cyan' : 'gray'} bold={isActive(field)}>
            {isActive(field) ? '▶ ' : '  '}
          </Text>
          <Text color={priorities.has(key) ? 'white' : 'gray'}>
            {checkbox(priorities.has(key))} {label}
          </Text>
        </Box>
      ))}

      <Text> </Text>

      {/* Options */}
      <Box>
        <Text color={isActive('closed') ? 'cyan' : 'gray'} bold={isActive('closed')}>
          {isActive('closed') ? '▶ ' : '  '}
        </Text>
        <Text color={includeClosed ? 'white' : 'gray'}>
          {checkbox(includeClosed)} include closed
        </Text>
      </Box>
      <Box>
        <Text color={isActive('subtasks') ? 'cyan' : 'gray'} bold={isActive('subtasks')}>
          {isActive('subtasks') ? '▶ ' : '  '}
        </Text>
        <Text color={subtasks ? 'white' : 'gray'}>
          {checkbox(subtasks)} include subtasks
        </Text>
      </Box>

      <Text> </Text>

      {/* Actions */}
      <Box gap={2}>
        <Text
          color={isActive('apply') ? 'green' : 'gray'}
          bold={isActive('apply')}
        >
          {isActive('apply') ? '▶ ' : '  '}[Apply]
        </Text>
        <Text
          color={isActive('reset') ? 'yellow' : 'gray'}
          bold={isActive('reset')}
        >
          {isActive('reset') ? '▶ ' : '  '}[Reset]
        </Text>
      </Box>
    </Box>
  );
}
