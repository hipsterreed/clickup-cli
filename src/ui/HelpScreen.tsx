import { Box, Text, useInput } from 'ink';

interface Props {
  onClose: () => void;
}

interface Section {
  title: string;
  rows: Array<[string, string]>;
}

const SECTIONS: Section[] = [
  {
    title: 'Browse Screen',
    rows: [
      ['↑ ↓', 'Navigate between scopes / lists'],
      ['enter', 'Open selected scope or list'],
      ['q', 'Quit'],
    ],
  },
  {
    title: 'Split Pane (task list)',
    rows: [
      ['↑ ↓', 'Move between tasks'],
      ['enter', 'Expand task to full screen'],
      ['n', 'Create new task (in list context only)'],
      ['s', 'Change status of selected task'],
      ['c', 'Add comment to selected task'],
      ['f', 'Open filter panel'],
      ['r', 'Refresh task list'],
      ['b / esc', 'Back to browse screen'],
      ['? / h', 'Show this help'],
      ['q', 'Quit'],
    ],
  },
  {
    title: 'Full-Screen Task View',
    rows: [
      ['s', 'Change status'],
      ['c', 'Add comment'],
      ['esc / b', 'Back to split pane'],
      ['q', 'Quit'],
    ],
  },
  {
    title: 'Filter Panel',
    rows: [
      ['↑ ↓', 'Navigate between filter fields'],
      ['space / enter', 'Toggle checkbox or cycle options'],
      ['← →', 'Cycle scope / list selection'],
      ['enter on [Apply]', 'Apply filters and reload tasks'],
      ['esc', 'Cancel without changing filters'],
    ],
  },
  {
    title: 'Create Task Form',
    rows: [
      ['↑ ↓', 'Move between fields'],
      ['enter', 'Edit text field / confirm selection'],
      ['← →', 'Cycle priority or status options'],
      ['enter on [Create Task]', 'Submit the form'],
      ['esc', 'Cancel'],
    ],
  },
  {
    title: 'Status Picker',
    rows: [
      ['↑ ↓', 'Navigate statuses'],
      ['enter', 'Confirm selected status'],
      ['esc', 'Cancel'],
    ],
  },
  {
    title: 'Comment Input',
    rows: [
      ['enter', 'Preview comment before posting'],
      ['p', 'Post comment (in preview)'],
      ['e', 'Edit comment (in preview)'],
      ['esc', 'Cancel'],
    ],
  },
];

export default function HelpScreen({ onClose }: Props) {
  useInput((input, key) => {
    if (input === 'q' || input === '?' || input === 'h' || key.escape || key.return) {
      onClose();
    }
  });

  const KEY_WIDTH = 24;
  const DESC_WIDTH = 44;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">ClickUp CLI — Keyboard Reference</Text>
      </Box>

      <Box flexDirection="row" flexWrap="wrap" gap={2}>
        {SECTIONS.map((section) => (
          <Box key={section.title} flexDirection="column" marginBottom={1} width={KEY_WIDTH + DESC_WIDTH + 4}>
            <Text bold color="white">{section.title}</Text>
            <Text color="gray">{'─'.repeat(KEY_WIDTH + DESC_WIDTH + 2)}</Text>
            {section.rows.map(([key, desc]) => (
              <Box key={key}>
                <Text color="cyan">{key.padEnd(KEY_WIDTH)}</Text>
                <Text color="gray">{desc}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press any key to close</Text>
      </Box>
    </Box>
  );
}
