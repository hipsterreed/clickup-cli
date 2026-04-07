import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { truncate, formatDateShort, formatDate, formatRelative } from '../utils/format.js';
import { statusColor, priorityColor } from '../ui/colors.js';
import { getConfig } from '../config/config.js';
export function QuickTaskList({ tasks, showDesc }) {
    const { userId } = getConfig();
    if (tasks.length === 0) {
        return _jsx(Text, { color: "gray", children: "No tasks found." });
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { bold: true, color: "cyan", children: ['ID'.padEnd(10), 'TITLE'.padEnd(38), 'STATUS'.padEnd(16), 'PRI'.padEnd(9), 'DUE'.padEnd(12), 'ASSIGNEES'] }) }), _jsx(Text, { color: "gray", children: '─'.repeat(100) }), tasks.map((t) => {
                const isMe = t.assignees.some((a) => a.id === userId);
                const assignees = t.assignees
                    .map((a) => (a.id === userId ? 'You' : a.username))
                    .join(', ') || '—';
                const pri = t.priority ? priorityColor(t.priority.id, t.priority.priority) : '—';
                return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: "gray", children: truncate(t.id, 9).padEnd(10) }), _jsx(Text, { bold: isMe, children: truncate(t.name, 37).padEnd(38) }), _jsx(Box, { width: 16, children: _jsx(Text, { wrap: "truncate", children: statusColor(t.status.status, t.status.color) }) }), _jsx(Box, { width: 9, children: _jsx(Text, { wrap: "truncate", children: pri }) }), _jsx(Text, { color: "gray", children: formatDateShort(t.due_date).padEnd(12) }), _jsx(Text, { color: isMe ? 'cyan' : 'white', children: truncate(assignees, 20) })] }), showDesc && t.description?.trim() && (_jsx(Box, { paddingLeft: 10, children: _jsx(Text, { color: "gray", dimColor: true, wrap: "wrap", children: truncate(t.description.trim(), 80) }) }))] }, t.id));
            }), _jsxs(Text, { color: "gray", dimColor: true, children: [tasks.length, " task", tasks.length !== 1 ? 's' : ''] })] }));
}
export function QuickTaskDetail({ task }) {
    const { userId } = getConfig();
    const assignees = task.assignees
        .map((a) => (a.id === userId ? 'You' : a.username))
        .join(', ') || '—';
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: task.name }), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: 'Status    ' }), _jsx(Text, { children: statusColor(task.status.status) }), _jsx(Text, { color: "gray", children: '    Priority  ' }), _jsx(Text, { children: task.priority ? priorityColor(task.priority.id, task.priority.priority) : '—' })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: 'Assignees ' }), _jsx(Text, { children: assignees })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: 'List      ' }), _jsx(Text, { children: task.list.name })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: 'Due       ' }), _jsx(Text, { children: task.due_date ? `${formatDate(task.due_date)} ${formatRelative(task.due_date)}` : '—' })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: 'ID        ' }), _jsx(Text, { color: "gray", dimColor: true, children: task.id })] }), task.description?.trim() && (_jsxs(_Fragment, { children: [_jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Description" }), _jsx(Text, { color: "gray", children: '─'.repeat(50) }), _jsx(Text, { wrap: "wrap", children: task.description.trim() })] }))] }));
}
