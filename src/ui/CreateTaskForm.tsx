import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import type { ClickUpStatus } from '../types/clickup.js';

export interface CreateTaskValues {
  name: string;
  description: string;
  priority: number | null; // 1-4 or null
  status: string | null;
  dueDate: string; // YYYY-MM-DD or ''
}

interface Props {
  listName: string;
  listStatuses: ClickUpStatus[];
  onSubmit: (values: CreateTaskValues) => void;
  onCancel: () => void;
}

type Field = 'name' | 'description' | 'priority' | 'status' | 'dueDate' | 'submit' | 'cancel';
const FIELDS: Field[] = ['name', 'description', 'priority', 'status', 'dueDate', 'submit', 'cancel'];
const TEXT_FIELDS: Field[] = ['name', 'description', 'dueDate'];

const PRIORITIES: Array<{ id: number | null; label: string; color: string }> = [
  { id: null, label: 'none', color: 'gray' },
  { id: 1, label: 'urgent', color: 'red' },
  { id: 2, label: 'high', color: 'red' },
  { id: 3, label: 'normal', color: 'yellow' },
  { id: 4, label: 'low', color: 'gray' },
];

export default function CreateTaskForm({
  listName,
  listStatuses,
  onSubmit,
  onCancel,
}: Props) {
  const [fieldIdx, setFieldIdx] = useState(0);
  const [editing, setEditing] = useState<Field | null>('name'); // start editing name immediately

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priorityIdx, setPriorityIdx] = useState(0); // index into PRIORITIES
  const [statusIdx, setStatusIdx] = useState(0);     // index into listStatuses (0 = none/default)
  const [dueDate, setDueDate] = useState('');
  const [dueDateError, setDueDateError] = useState('');

  const activeField = FIELDS[fieldIdx];
  const statuses = [{ status: '(default)', color: '' }, ...listStatuses];

  useInput((input, key) => {
    // While editing a text field, only handle esc/enter
    if (editing && TEXT_FIELDS.includes(editing)) {
      if (key.escape) {
        setEditing(null);
      } else if (key.return) {
        if (editing === 'dueDate') validateDueDate(dueDate);
        setEditing(null);
        // advance to next field
        setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
      }
      return; // let TextInput handle the rest
    }

    // Navigation
    if (key.upArrow) {
      setFieldIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
      return;
    }

    if (key.escape) { onCancel(); return; }

    if (key.return || input === ' ') {
      switch (activeField) {
        case 'name':
        case 'description':
        case 'dueDate':
          setEditing(activeField);
          break;
        case 'priority':
          // cycle on space/enter; left/right handled below
          setPriorityIdx((i) => (i + 1) % PRIORITIES.length);
          break;
        case 'status':
          setStatusIdx((i) => (i + 1) % statuses.length);
          break;
        case 'submit':
          handleSubmit();
          break;
        case 'cancel':
          onCancel();
          break;
      }
      return;
    }

    // Left/right for cycling pickers
    if (activeField === 'priority') {
      if (key.leftArrow) setPriorityIdx((i) => (i - 1 + PRIORITIES.length) % PRIORITIES.length);
      if (key.rightArrow) setPriorityIdx((i) => (i + 1) % PRIORITIES.length);
    }
    if (activeField === 'status') {
      if (key.leftArrow) setStatusIdx((i) => (i - 1 + statuses.length) % statuses.length);
      if (key.rightArrow) setStatusIdx((i) => (i + 1) % statuses.length);
    }
  });

  function validateDueDate(val: string): boolean {
    if (!val) { setDueDateError(''); return true; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      setDueDateError('Use YYYY-MM-DD format');
      return false;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) { setDueDateError('Invalid date'); return false; }
    setDueDateError('');
    return true;
  }

  function handleSubmit() {
    if (!name.trim()) {
      setFieldIdx(0);
      setEditing('name');
      return;
    }
    if (!validateDueDate(dueDate)) {
      setFieldIdx(FIELDS.indexOf('dueDate'));
      return;
    }

    const selectedPriority = PRIORITIES[priorityIdx];
    const selectedStatus = statuses[statusIdx];
    let dueDateMs: number | undefined;
    if (dueDate) {
      dueDateMs = new Date(dueDate).getTime();
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      priority: selectedPriority.id,
      status: selectedStatus.status === '(default)' ? null : selectedStatus.status,
      dueDate: dueDate,
    });
  }

  function isActive(f: Field) { return activeField === f; }

  function rowPrefix(f: Field) {
    return (
      <Text color={isActive(f) ? 'cyan' : 'gray'} bold={isActive(f)}>
        {isActive(f) ? '▶ ' : '  '}
      </Text>
    );
  }

  function label(text: string) {
    return <Text color="gray">{text.padEnd(13)}</Text>;
  }

  const selectedPri = PRIORITIES[priorityIdx];
  const selectedStatus = statuses[statusIdx];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      {/* Header */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">Create Task</Text>
        <Text color="gray" dimColor>List: {listName}</Text>
        <Text color="gray" dimColor>↑↓ navigate  ·  enter edit/confirm  ·  ←→ cycle options  ·  esc cancel</Text>
      </Box>

      {/* Name */}
      <Box>
        {rowPrefix('name')}
        {label('Name *')}
        {editing === 'name' ? (
          <TextInput value={name} onChange={setName} onSubmit={() => { setEditing(null); setFieldIdx(1); }} placeholder="Task name..." />
        ) : (
          <Text color={name ? 'white' : 'gray'} dimColor={!name}>
            {name || '(required — press enter to edit)'}
          </Text>
        )}
      </Box>

      {/* Description */}
      <Box>
        {rowPrefix('description')}
        {label('Description')}
        {editing === 'description' ? (
          <TextInput value={description} onChange={setDescription} onSubmit={() => { setEditing(null); setFieldIdx(2); }} placeholder="Optional description..." />
        ) : (
          <Text color={description ? 'white' : 'gray'} dimColor={!description}>
            {description || '(optional)'}
          </Text>
        )}
      </Box>

      {/* Priority */}
      <Box>
        {rowPrefix('priority')}
        {label('Priority')}
        <Box gap={1}>
          {PRIORITIES.map((p, i) => (
            <Text
              key={p.label}
              color={i === priorityIdx ? (p.color as Parameters<typeof Text>[0]['color']) : 'gray'}
              bold={i === priorityIdx}
              inverse={i === priorityIdx && isActive('priority')}
            >
              {p.label}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Status */}
      {listStatuses.length > 0 && (
        <Box>
          {rowPrefix('status')}
          {label('Status')}
          <Box gap={1}>
            {statuses.map((s, i) => (
              <Text
                key={s.status}
                color={i === statusIdx ? 'cyan' : 'gray'}
                bold={i === statusIdx}
                inverse={i === statusIdx && isActive('status')}
              >
                {s.status}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Due date */}
      <Box>
        {rowPrefix('dueDate')}
        {label('Due date')}
        {editing === 'dueDate' ? (
          <TextInput
            value={dueDate}
            onChange={setDueDate}
            onSubmit={() => { validateDueDate(dueDate); setEditing(null); setFieldIdx(FIELDS.indexOf('submit')); }}
            placeholder="YYYY-MM-DD"
          />
        ) : (
          <Box>
            <Text color={dueDate ? 'white' : 'gray'} dimColor={!dueDate}>
              {dueDate || '(optional)'}
            </Text>
            {dueDateError && <Text color="red">  {dueDateError}</Text>}
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box marginTop={1} gap={2}>
        <Box>
          {rowPrefix('submit')}
          <Text
            color={isActive('submit') ? 'green' : 'gray'}
            bold={isActive('submit')}
            inverse={isActive('submit')}
          >
            {' Create Task '}
          </Text>
        </Box>
        <Box>
          {rowPrefix('cancel')}
          <Text color={isActive('cancel') ? 'red' : 'gray'} bold={isActive('cancel')}>
            Cancel
          </Text>
        </Box>
      </Box>

      {!name.trim() && isActive('submit') && (
        <Text color="red">  Task name is required.</Text>
      )}
    </Box>
  );
}
