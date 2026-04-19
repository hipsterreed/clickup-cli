import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { truncate } from '../utils/format.js';
import { statusDot } from './colors.js';
import { getConfig } from '../config/config.js';
const COL_TITLE = 28;
const COL_STATUS = 13;
const COL_ASSIGNEE = 14;
export default function TaskTable({ tasks, selectedIndex, onSelect, height, isFocused = true, }) {
    const { userId } = getConfig();
    const [scrollOffset, setScrollOffset] = useState(0);
    useInput((_, key) => {
        if (key.upArrow) {
            const next = Math.max(0, selectedIndex - 1);
            onSelect(next);
            if (next < scrollOffset)
                setScrollOffset(next);
        }
        else if (key.downArrow) {
            const next = Math.min(tasks.length - 1, selectedIndex + 1);
            onSelect(next);
            if (next >= scrollOffset + height)
                setScrollOffset(next - height + 1);
        }
    }, { isActive: isFocused });
    // Clamp scroll when tasks list changes
    useEffect(() => {
        if (tasks.length <= height)
            setScrollOffset(0);
    }, [tasks.length]);
    // Progress bar
    const barWidth = COL_TITLE + COL_STATUS + COL_ASSIGNEE + 2;
    const doneTasks = tasks.filter((t) => t.status.type === 'closed' || t.status.type === 'done').length;
    const pct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const filled = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * barWidth) : 0;
    const progressFilled = '='.repeat(filled);
    const progressEmpty = '-'.repeat(barWidth - filled);
    const progressLabel = tasks.length > 0 ? `${pct}% complete  ·  ${doneTasks}/${tasks.length}` : '0 tasks';
    // Build exactly `height` display rows (pad with empty rows if needed)
    const visibleTasks = tasks.slice(scrollOffset, scrollOffset + height);
    const emptyRows = Math.max(0, height - visibleTasks.length);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { color: "gray", children: ['  ', 'TITLE'.padEnd(COL_TITLE), ' ', 'STATUS'.padEnd(COL_STATUS), ' ', 'ASSIGNEE'.padEnd(COL_ASSIGNEE)] }) }), visibleTasks.map((task, i) => {
                const absIdx = scrollOffset + i;
                const isSelected = absIdx === selectedIndex;
                const isMe = task.assignees.some((a) => a.id === userId);
                const dot = statusDot(task.status.status, task.status.color);
                const title = truncate(task.name, COL_TITLE);
                const assigneeNames = task.assignees.map((a) => a.username).join(', ');
                const assigneeStr = truncate(assigneeNames || '—', COL_ASSIGNEE);
                return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', children: isSelected ? '▶ ' : '  ' }), _jsx(Box, { width: COL_TITLE, children: _jsx(Text, { bold: isSelected, color: isSelected ? 'cyan' : isMe ? 'white' : 'white', wrap: "truncate", children: title.padEnd(COL_TITLE) }) }), _jsx(Text, { children: " " }), _jsx(Box, { width: COL_STATUS, children: _jsxs(Text, { wrap: "truncate", children: [dot, ' ', _jsx(Text, { color: "white", children: truncate(task.status.status, COL_STATUS - 2).padEnd(COL_STATUS - 2) })] }) }), _jsx(Text, { children: " " }), _jsx(Box, { width: COL_ASSIGNEE, children: _jsx(Text, { color: isMe ? 'cyan' : 'gray', wrap: "truncate", children: assigneeStr.padEnd(COL_ASSIGNEE) }) })] }, task.id));
            }), Array.from({ length: emptyRows }).map((_, i) => (_jsx(Box, { children: _jsx(Text, { children: " " }) }, `empty-${i}`))), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { color: "green", children: ['  ', progressFilled] }), _jsx(Text, { color: "gray", children: progressEmpty })] }), _jsx(Box, { children: _jsxs(Text, { color: "gray", children: ['  ', progressLabel] }) })] })] }));
}
