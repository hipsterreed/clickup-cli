import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
const SECTIONS = [
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
export default function HelpScreen({ onClose }) {
    useInput((input, key) => {
        if (input === 'q' || input === '?' || input === 'h' || key.escape || key.return) {
            onClose();
        }
    });
    const KEY_WIDTH = 24;
    const DESC_WIDTH = 44;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "ClickUp CLI \u2014 Keyboard Reference" }) }), _jsx(Box, { flexDirection: "row", flexWrap: "wrap", gap: 2, children: SECTIONS.map((section) => (_jsxs(Box, { flexDirection: "column", marginBottom: 1, width: KEY_WIDTH + DESC_WIDTH + 4, children: [_jsx(Text, { bold: true, color: "white", children: section.title }), _jsx(Text, { color: "gray", children: '─'.repeat(KEY_WIDTH + DESC_WIDTH + 2) }), section.rows.map(([key, desc]) => (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: key.padEnd(KEY_WIDTH) }), _jsx(Text, { color: "gray", children: desc })] }, key)))] }, section.title))) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press any key to close" }) })] }));
}
