import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { truncate, formatDateShort } from '../utils/format.js';
import { statusDot, priorityLabelFromId, priorityColorInk } from './colors.js';
import { getConfig } from '../config/config.js';
const COL_TITLE = 28;
const COL_STATUS = 13;
const COL_PRI = 7;
const COL_DUE = 7;
export default function TaskTable({ tasks, selectedIndex, onSelect, height, isFocused = true, }) {
    const { userId } = getConfig();
    const [scrollOffset, setScrollOffset] = useState(0);
    // Keep selection in view
    useEffect(() => {
        if (selectedIndex < scrollOffset) {
            setScrollOffset(selectedIndex);
        }
        else if (selectedIndex >= scrollOffset + height) {
            setScrollOffset(selectedIndex - height + 1);
        }
    }, [selectedIndex, height]);
    // Clamp scroll when tasks shrink
    useEffect(() => {
        if (scrollOffset > 0 && tasks.length <= height) {
            setScrollOffset(0);
        }
    }, [tasks.length]);
    useInput((_, key) => {
        if (key.upArrow) {
            onSelect(Math.max(0, selectedIndex - 1));
        }
        else if (key.downArrow) {
            onSelect(Math.min(tasks.length - 1, selectedIndex + 1));
        }
    }, { isActive: isFocused });
    // Build exactly `height` display rows (pad with empty rows if needed)
    const visibleTasks = tasks.slice(scrollOffset, scrollOffset + height);
    const emptyRows = Math.max(0, height - visibleTasks.length);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { color: "gray", dimColor: true, children: ['  ', 'TITLE'.padEnd(COL_TITLE), ' ', 'STATUS'.padEnd(COL_STATUS), ' ', 'PRI'.padEnd(COL_PRI), ' ', 'DUE'.padEnd(COL_DUE)] }) }), visibleTasks.map((task, i) => {
                const absIdx = scrollOffset + i;
                const isSelected = absIdx === selectedIndex;
                const isMe = task.assignees.some((a) => a.id === userId);
                const priId = task.priority?.id;
                const priLabel = priorityLabelFromId(priId);
                const priColors = priorityColorInk(priId);
                const dot = statusDot(task.status.status, task.status.color);
                const dueStr = formatDateShort(task.due_date);
                const isOverdue = task.due_date && parseInt(task.due_date) < Date.now();
                const title = truncate(task.name, COL_TITLE);
                return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', children: isSelected ? '▶ ' : '  ' }), _jsx(Box, { width: COL_TITLE, children: _jsx(Text, { bold: isSelected, color: isSelected ? 'cyan' : isMe ? 'white' : 'white', wrap: "truncate", children: title.padEnd(COL_TITLE) }) }), _jsx(Text, { children: " " }), _jsx(Box, { width: COL_STATUS, children: _jsxs(Text, { wrap: "truncate", children: [dot, ' ', _jsx(Text, { color: "white", dimColor: !isSelected, children: truncate(task.status.status, COL_STATUS - 2).padEnd(COL_STATUS - 2) })] }) }), _jsx(Text, { children: " " }), _jsx(Box, { width: COL_PRI, children: _jsx(Text, { color: priColors.color, wrap: "truncate", children: truncate(priLabel, COL_PRI).padEnd(COL_PRI) }) }), _jsx(Text, { children: " " }), _jsx(Box, { width: COL_DUE, children: _jsx(Text, { color: isOverdue ? 'red' : 'gray', dimColor: !isOverdue, wrap: "truncate", children: dueStr.padEnd(COL_DUE) }) })] }, task.id));
            }), Array.from({ length: emptyRows }).map((_, i) => (_jsx(Box, { children: _jsx(Text, { children: " " }) }, `empty-${i}`))), _jsx(Box, { children: tasks.length > height ? (_jsxs(Text, { color: "gray", dimColor: true, children: ['  ', scrollOffset + 1, "\u2013", Math.min(scrollOffset + height, tasks.length), " of ", tasks.length] })) : (_jsxs(Text, { color: "gray", dimColor: true, children: ['  ', tasks.length, " task", tasks.length !== 1 ? 's' : ''] })) })] }));
}
