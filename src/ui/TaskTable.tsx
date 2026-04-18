import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import type { ClickUpTask } from '../types/clickup.js';
import { truncate } from '../utils/format.js';
import { statusDot } from './colors.js';
import { getConfig } from '../config/config.js';

interface Props {
  tasks: ClickUpTask[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Number of task rows to render — content is always this tall */
  height: number;
  isFocused?: boolean;
}

const COL_TITLE = 28;
const COL_STATUS = 13;
const COL_ASSIGNEE = 14;

export default function TaskTable({
  tasks,
  selectedIndex,
  onSelect,
  height,
  isFocused = true,
}: Props) {
  const { userId } = getConfig();
  const [scrollOffset, setScrollOffset] = useState(0);

  // Keep selection in view
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + height) {
      setScrollOffset(selectedIndex - height + 1);
    }
  }, [selectedIndex, height]);

  // Clamp scroll when tasks shrink
  useEffect(() => {
    if (scrollOffset > 0 && tasks.length <= height) {
      setScrollOffset(0);
    }
  }, [tasks.length]);

  useInput(
    (_, key) => {
      if (key.upArrow) {
        onSelect(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow) {
        onSelect(Math.min(tasks.length - 1, selectedIndex + 1));
      }
    },
    { isActive: isFocused },
  );

  // Build exactly `height` display rows (pad with empty rows if needed)
  const visibleTasks = tasks.slice(scrollOffset, scrollOffset + height);
  const emptyRows = Math.max(0, height - visibleTasks.length);

  return (
    <Box flexDirection="column">
      {/* Column header — always 1 row */}
      <Box>
        <Text color="gray">
          {'  '}
          {'TITLE'.padEnd(COL_TITLE)}
          {' '}
          {'STATUS'.padEnd(COL_STATUS)}
          {' '}
          {'ASSIGNEE'.padEnd(COL_ASSIGNEE)}
        </Text>
      </Box>

      {/* Task rows */}
      {visibleTasks.map((task, i) => {
        const absIdx = scrollOffset + i;
        const isSelected = absIdx === selectedIndex;
        const isMe = task.assignees.some((a) => a.id === userId);
        const dot = statusDot(task.status.status, task.status.color);
        const title = truncate(task.name, COL_TITLE);
        const assigneeNames = task.assignees.map((a) => a.username).join(', ');
        const assigneeStr = truncate(assigneeNames || '—', COL_ASSIGNEE);

        return (
          <Box key={task.id}>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Box width={COL_TITLE}>
              <Text bold={isSelected} color={isSelected ? 'cyan' : isMe ? 'white' : 'white'} wrap="truncate">
                {title.padEnd(COL_TITLE)}
              </Text>
            </Box>
            <Text> </Text>
            <Box width={COL_STATUS}>
              <Text wrap="truncate">
                {dot}{' '}
                <Text color="white">
                  {truncate(task.status.status, COL_STATUS - 2).padEnd(COL_STATUS - 2)}
                </Text>
              </Text>
            </Box>
            <Text> </Text>
            <Box width={COL_ASSIGNEE}>
              <Text color={isMe ? 'cyan' : 'gray'} wrap="truncate">
                {assigneeStr.padEnd(COL_ASSIGNEE)}
              </Text>
            </Box>
          </Box>
        );
      })}

      {/* Empty padding rows to keep height constant */}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <Box key={`empty-${i}`}>
          <Text> </Text>
        </Box>
      ))}

      {/* Scroll indicator — always 1 row */}
      <Box>
        {tasks.length > height ? (
          <Text color="gray">
            {'  '}{scrollOffset + 1}–{Math.min(scrollOffset + height, tasks.length)} of {tasks.length}
          </Text>
        ) : (
          <Text color="gray">
            {'  '}{tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Text>
        )}
      </Box>
    </Box>
  );
}
