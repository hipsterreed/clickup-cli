import { Box, Text } from 'ink';
import type { ClickUpTask, ClickUpComment } from '../types/clickup.js';
import { formatDate, formatRelative, truncate } from '../utils/format.js';
import { statusColorInk, priorityLabelFromId, priorityColorInk } from './colors.js';
import { getConfig } from '../config/config.js';
import CommentThread from './CommentThread.js';

interface Props {
  task: ClickUpTask | null;
  /** When true: compact fixed-height view (no comments, short desc). Use in split pane. */
  compact?: boolean;
  comments?: ClickUpComment[];
  loadingComments?: boolean;
}

const EMPTY_LINES = 3;
const DESC_LINES_COMPACT = 4; // lines of description in split mode
const DESC_CHARS_PER_LINE = 60;

export default function TaskDetail({ task, compact = false, comments, loadingComments }: Props) {
  if (!task) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text color="gray">Select a task to view details</Text>
      </Box>
    );
  }

  const { userId } = getConfig();
  const statusCol = statusColorInk(task.status.status);
  const priId = task.priority?.id;
  const priLabel = priorityLabelFromId(priId);
  const priColors = priorityColorInk(priId);

  const assigneeNames =
    task.assignees.map((a) => (a.id === userId ? 'You' : a.username)).join(', ') || '—';

  const dueStr = task.due_date
    ? `${formatDate(task.due_date)} ${formatRelative(task.due_date)}`
    : '—';

  const isOverdue = task.due_date && parseInt(task.due_date) < Date.now();

  const descText = task.description?.trim() ?? '';
  const descDisplay = compact
    ? truncate(descText, DESC_LINES_COMPACT * DESC_CHARS_PER_LINE)
    : descText;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Title — always 2 rows reserved */}
      <Box marginBottom={1}>
        <Text bold color="white" wrap="truncate-end">
          {task.name}
        </Text>
      </Box>

      {/* Meta grid — always 5 rows */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text color="gray">Status    </Text>
          <Text color={statusCol as Parameters<typeof Text>[0]['color']}>
            ● {task.status.status}
          </Text>
        </Box>
        <Box>
          <Text color="gray">Priority  </Text>
          <Text
            color={priColors.color as Parameters<typeof Text>[0]['color']}
            backgroundColor={priColors.bgColor as Parameters<typeof Text>[0]['backgroundColor']}
          >
            {priId === '1' ? ` ${priLabel} ` : priLabel}
          </Text>
        </Box>
        <Box>
          <Text color="gray">Assignees </Text>
          <Text wrap="truncate-end">{assigneeNames}</Text>
        </Box>
        <Box>
          <Text color="gray">List      </Text>
          <Text wrap="truncate-end">{task.list.name}</Text>
        </Box>
        <Box>
          <Text color="gray">Due       </Text>
          <Text color={isOverdue ? 'red' : 'white'}>{dueStr}</Text>
        </Box>
      </Box>

      {/* Description — always rendered even if empty */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Description</Text>
        <Text color="gray">{'─'.repeat(45)}</Text>
        {descText ? (
          <Text wrap="wrap" color="white">
            {descDisplay}
          </Text>
        ) : (
          <Text color="gray">No description.</Text>
        )}
      </Box>

      {/* In compact (split) mode: show hint instead of comments */}
      {compact && (
        <Box>
          <Text color="gray">enter to expand  ·  c to comment  ·  s to change status</Text>
        </Box>
      )}

      {/* In fullscreen mode: show comments */}
      {!compact && (
        <Box flexDirection="column">
          {loadingComments ? (
            <Text color="gray">Loading comments...</Text>
          ) : comments !== undefined ? (
            <CommentThread comments={comments} />
          ) : null}
        </Box>
      )}
    </Box>
  );
}
