import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useMemo } from 'react';
export default function FilterPanel({ filters, taskStatuses, onApply, onCancel }) {
    const [statuses, setStatuses] = useState(new Set(filters.statuses ?? []));
    const [includeClosed, setIncludeClosed] = useState(filters.includeClosed ?? false);
    const [subtasks, setSubtasks] = useState(filters.subtasks ?? false);
    const [fieldIdx, setFieldIdx] = useState(0);
    const fields = useMemo(() => [
        ...taskStatuses.map((s) => `status:${s.status}`),
        'closed',
        'subtasks',
    ], [taskStatuses]);
    const field = fields[Math.min(fieldIdx, fields.length - 1)];
    function toggleStatus(key) {
        setStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(key))
                next.delete(key);
            else
                next.add(key);
            return next;
        });
    }
    function handleApply() {
        onApply({
            ...filters,
            statuses: statuses.size > 0 ? [...statuses] : undefined,
            includeClosed,
            subtasks,
        });
    }
    function handleReset() {
        setStatuses(new Set());
        setIncludeClosed(false);
        setSubtasks(false);
        setFieldIdx(0);
    }
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return) {
            handleApply();
            return;
        }
        if (input === 'r') {
            handleReset();
            return;
        }
        if (key.upArrow) {
            setFieldIdx((i) => Math.max(0, i - 1));
            return;
        }
        if (key.downArrow) {
            setFieldIdx((i) => Math.min(fields.length - 1, i + 1));
            return;
        }
        if (input === ' ') {
            if (field.startsWith('status:')) {
                toggleStatus(field.slice(7));
            }
            else if (field === 'closed') {
                setIncludeClosed((v) => !v);
            }
            else if (field === 'subtasks') {
                setSubtasks((v) => !v);
            }
        }
    });
    function checkbox(checked) { return checked ? '[✓]' : '[ ]'; }
    function isField(f) { return field === f; }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Filters" }), _jsx(Text, { color: "gray", children: "\u2191\u2193 navigate  \u00B7  space toggle  \u00B7  enter apply  \u00B7  r reset  \u00B7  esc cancel" }), _jsx(Text, { children: " " }), _jsx(Text, { color: "gray", children: "  Status" }), taskStatuses.map((s) => {
                const f = `status:${s.status}`;
                return (_jsxs(Box, { children: [_jsx(Text, { color: isField(f) ? 'cyan' : 'gray', bold: isField(f), children: isField(f) ? '▶ ' : '  ' }), _jsxs(Text, { color: statuses.has(s.status) ? 'white' : 'gray', children: [checkbox(statuses.has(s.status)), " ", s.status] })] }, f));
            }), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsx(Text, { color: isField('closed') ? 'cyan' : 'gray', bold: isField('closed'), children: isField('closed') ? '▶ ' : '  ' }), _jsxs(Text, { color: includeClosed ? 'white' : 'gray', children: [checkbox(includeClosed), " include closed"] })] }), _jsxs(Box, { children: [_jsx(Text, { color: isField('subtasks') ? 'cyan' : 'gray', bold: isField('subtasks'), children: isField('subtasks') ? '▶ ' : '  ' }), _jsxs(Text, { color: subtasks ? 'white' : 'gray', children: [checkbox(subtasks), " include subtasks"] })] }), _jsx(Text, { children: " " }), _jsx(Text, { color: "gray", children: "  enter apply  \u00B7  r reset" })] }));
}
