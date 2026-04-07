import { Box, Text } from 'ink';
import type { ClickUpTask } from '../types/clickup.js';
import { truncate, formatDateShort, formatDate, formatRelative } from '../utils/format.js';
import { statusColor, priorityColor } from '../ui/colors.js';
import { getConfig } from '../config/config.js';

// Non-interactive table output for flag mode (scriptable)

interface TaskListProps {
  tasks: ClickUpTask[];
  showDesc?: boolean;
}

export function QuickTaskList({ tasks, showDesc }: TaskListProps) {
  const { userId } = getConfig();

  if (tasks.length === 0) {
    return <Text color="gray">No tasks found.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">
          {'ID'.padEnd(10)}
          {'TITLE'.padEnd(38)}
          {'STATUS'.padEnd(16)}
          {'PRI'.padEnd(9)}
          {'DUE'.padEnd(12)}
          {'ASSIGNEES'}
        </Text>
      </Box>
      <Text color="gray">{'─'.repeat(100)}</Text>
      {tasks.map((t) => {
        const isMe = t.assignees.some((a) => a.id === userId);
        const assignees = t.assignees
          .map((a) => (a.id === userId ? 'You' : a.username))
          .join(', ') || '—';
        const pri = t.priority ? priorityColor(t.priority.id, t.priority.priority) : '—';

        return (
          <Box key={t.id} flexDirection="column">
            <Box>
              <Text color="gray">{truncate(t.id, 9).padEnd(10)}</Text>
              <Text bold={isMe}>{truncate(t.name, 37).padEnd(38)}</Text>
              <Box width={16}>
                <Text wrap="truncate">{statusColor(t.status.status, t.status.color)}</Text>
              </Box>
              <Box width={9}>
                <Text wrap="truncate">{pri}</Text>
              </Box>
              <Text color="gray">{formatDateShort(t.due_date).padEnd(12)}</Text>
              <Text color={isMe ? 'cyan' : 'white'}>{truncate(assignees, 20)}</Text>
            </Box>
            {showDesc && t.description?.trim() && (
              <Box paddingLeft={10}>
                <Text color="gray" dimColor wrap="wrap">
                  {truncate(t.description.trim(), 80)}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
      <Text color="gray" dimColor>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</Text>
    </Box>
  );
}

interface TaskDetailProps {
  task: ClickUpTask;
  showComments?: boolean;
}

export function QuickTaskDetail({ task }: TaskDetailProps) {
  const { userId } = getConfig();
  const assignees = task.assignees
    .map((a) => (a.id === userId ? 'You' : a.username))
    .join(', ') || '—';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">{task.name}</Text>
      <Text> </Text>
      <Box>
        <Text color="gray">{'Status    '}</Text>
        <Text>{statusColor(task.status.status)}</Text>
        <Text color="gray">{'    Priority  '}</Text>
        <Text>{task.priority ? priorityColor(task.priority.id, task.priority.priority) : '—'}</Text>
      </Box>
      <Box>
        <Text color="gray">{'Assignees '}</Text>
        <Text>{assignees}</Text>
      </Box>
      <Box>
        <Text color="gray">{'List      '}</Text>
        <Text>{task.list.name}</Text>
      </Box>
      <Box>
        <Text color="gray">{'Due       '}</Text>
        <Text>{task.due_date ? `${formatDate(task.due_date)} ${formatRelative(task.due_date)}` : '—'}</Text>
      </Box>
      <Box>
        <Text color="gray">{'ID        '}</Text>
        <Text color="gray" dimColor>{task.id}</Text>
      </Box>
      {task.description?.trim() && (
        <>
          <Text> </Text>
          <Text bold>Description</Text>
          <Text color="gray">{'─'.repeat(50)}</Text>
          <Text wrap="wrap">{task.description.trim()}</Text>
        </>
      )}
    </Box>
  );
}
