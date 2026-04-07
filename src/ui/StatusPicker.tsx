import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import type { ClickUpStatus } from '../types/clickup.js';
import { statusColorInk } from './colors.js';

interface Props {
  statuses: ClickUpStatus[];
  currentStatus: string;
  onConfirm: (status: string) => void;
  onCancel: () => void;
}

export default function StatusPicker({
  statuses,
  currentStatus,
  onConfirm,
  onCancel,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const idx = statuses.findIndex(
      (s) => s.status.toLowerCase() === currentStatus.toLowerCase(),
    );
    return idx >= 0 ? idx : 0;
  });
  const [flash, setFlash] = useState(false);

  useInput((_, key) => {
    if (key.upArrow) {
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIdx((i) => Math.min(statuses.length - 1, i + 1));
    } else if (key.return) {
      setFlash(true);
    } else if (key.escape) {
      onCancel();
    }
  });

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => {
      onConfirm(statuses[selectedIdx].status);
    }, 200);
    return () => clearTimeout(timer);
  }, [flash]);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">Change Status</Text>
      </Box>

      {statuses.map((s, i) => {
        const isSelected = i === selectedIdx;
        const isCurrent = s.status.toLowerCase() === currentStatus.toLowerCase();
        const color = statusColorInk(s.status);

        return (
          <Box key={s.status}>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text
              color={flash && isSelected ? 'white' : (color as Parameters<typeof Text>[0]['color'])}
              bold={isSelected}
              inverse={flash && isSelected}
            >
              ● {s.status}
            </Text>
            {isCurrent && (
              <Text color="gray" dimColor>  ← current</Text>
            )}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color="gray" dimColor>enter confirm  ·  esc cancel</Text>
      </Box>
    </Box>
  );
}
