import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { formatDate, formatRelative, truncate } from '../utils/format.js';
import { statusColorInk, priorityLabelFromId, priorityColorInk } from './colors.js';
import { getConfig } from '../config/config.js';
import CommentThread from './CommentThread.js';
const EMPTY_LINES = 3;
const DESC_LINES_COMPACT = 4; // lines of description in split mode
const DESC_CHARS_PER_LINE = 60;
export default function TaskDetail({ task, compact = false, comments, loadingComments }) {
    if (!task) {
        return (_jsx(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: _jsx(Text, { color: "gray", children: "Select a task to view details" }) }));
    }
    const { userId } = getConfig();
    const statusCol = statusColorInk(task.status.status);
    const priId = task.priority?.id;
    const priLabel = priorityLabelFromId(priId);
    const priColors = priorityColorInk(priId);
    const assigneeNames = task.assignees.map((a) => (a.id === userId ? 'You' : a.username)).join(', ') || '—';
    const dueStr = task.due_date
        ? `${formatDate(task.due_date)} ${formatRelative(task.due_date)}`
        : '—';
    const isOverdue = task.due_date && parseInt(task.due_date) < Date.now();
    const descText = task.description?.trim() ?? '';
    const descDisplay = compact
        ? truncate(descText, DESC_LINES_COMPACT * DESC_CHARS_PER_LINE)
        : descText;
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "white", wrap: "truncate-end", children: task.name }) }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "Status    " }), _jsxs(Text, { color: statusCol, children: ["\u25CF ", task.status.status] })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "Priority  " }), _jsx(Text, { color: priColors.color, backgroundColor: priColors.bgColor, children: priId === '1' ? ` ${priLabel} ` : priLabel })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "Assignees " }), _jsx(Text, { wrap: "truncate-end", children: assigneeNames })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "List      " }), _jsx(Text, { wrap: "truncate-end", children: task.list.name })] }), _jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "Due       " }), _jsx(Text, { color: isOverdue ? 'red' : 'white', children: dueStr })] })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: "Description" }), _jsx(Text, { color: "gray", children: '─'.repeat(45) }), descText ? (_jsx(Text, { wrap: "wrap", color: "white", children: descDisplay })) : (_jsx(Text, { color: "gray", children: "No description." }))] }), compact && (_jsx(Box, { children: _jsx(Text, { color: "gray", children: "enter to expand  \u00B7  c to comment  \u00B7  s to change status" }) })), !compact && (_jsx(Box, { flexDirection: "column", children: loadingComments ? (_jsx(Text, { color: "gray", children: "Loading comments..." })) : comments !== undefined ? (_jsx(CommentThread, { comments: comments })) : null }))] }));
}
