import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
const FIELDS = [
    'scope', 'list',
    'status_todo', 'status_inprogress', 'status_review', 'status_done',
    'priority_urgent', 'priority_high', 'priority_normal', 'priority_low',
    'closed', 'subtasks',
    'apply', 'reset',
];
export default function FilterPanel({ filters, lists, onApply, onCancel }) {
    const [scope, setScope] = useState(filters.me ? 'me' : filters.listId ? 'list' : 'all');
    const [listIdx, setListIdx] = useState(() => {
        if (!filters.listId)
            return 0;
        const i = lists.findIndex((l) => l.id === filters.listId);
        return i >= 0 ? i : 0;
    });
    const [statuses, setStatuses] = useState(new Set(filters.statuses ?? []));
    const [priorities, setPriorities] = useState(new Set(filters.priorities ?? []));
    const [includeClosed, setIncludeClosed] = useState(filters.includeClosed ?? false);
    const [subtasks, setSubtasks] = useState(filters.subtasks ?? false);
    const [fieldIdx, setFieldIdx] = useState(0);
    useInput((input, key) => {
        const field = FIELDS[fieldIdx];
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.upArrow) {
            setFieldIdx((i) => Math.max(0, i - 1));
            return;
        }
        if (key.downArrow) {
            setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
            return;
        }
        if (key.return || input === ' ') {
            switch (field) {
                case 'scope':
                    setScope((s) => s === 'me' ? 'list' : s === 'list' ? 'all' : 'me');
                    break;
                case 'list':
                    if (scope === 'list')
                        setListIdx((i) => (i + 1) % lists.length);
                    break;
                case 'status_todo':
                    toggleStatus('to do');
                    break;
                case 'status_inprogress':
                    toggleStatus('in progress');
                    break;
                case 'status_review':
                    toggleStatus('in review');
                    break;
                case 'status_done':
                    toggleStatus('done');
                    break;
                case 'priority_urgent':
                    togglePriority('1');
                    break;
                case 'priority_high':
                    togglePriority('2');
                    break;
                case 'priority_normal':
                    togglePriority('3');
                    break;
                case 'priority_low':
                    togglePriority('4');
                    break;
                case 'closed':
                    setIncludeClosed((v) => !v);
                    break;
                case 'subtasks':
                    setSubtasks((v) => !v);
                    break;
                case 'apply':
                    handleApply();
                    break;
                case 'reset':
                    handleReset();
                    break;
            }
        }
        // Left/right for scope
        if (field === 'scope') {
            if (key.leftArrow)
                setScope((s) => s === 'me' ? 'all' : s === 'list' ? 'me' : 'list');
            if (key.rightArrow)
                setScope((s) => s === 'me' ? 'list' : s === 'list' ? 'all' : 'me');
        }
        if (field === 'list' && scope === 'list') {
            if (key.leftArrow)
                setListIdx((i) => Math.max(0, i - 1));
            if (key.rightArrow)
                setListIdx((i) => Math.min(lists.length - 1, i + 1));
        }
    });
    function toggleStatus(s) {
        setStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(s))
                next.delete(s);
            else
                next.add(s);
            return next;
        });
    }
    function togglePriority(p) {
        setPriorities((prev) => {
            const next = new Set(prev);
            if (next.has(p))
                next.delete(p);
            else
                next.add(p);
            return next;
        });
    }
    function handleApply() {
        onApply({
            me: scope === 'me',
            listId: scope === 'list' && lists[listIdx] ? lists[listIdx].id : undefined,
            statuses: statuses.size > 0 ? [...statuses] : undefined,
            priorities: priorities.size > 0 ? [...priorities] : undefined,
            includeClosed,
            subtasks,
        });
    }
    function handleReset() {
        setScope('me');
        setStatuses(new Set());
        setPriorities(new Set());
        setIncludeClosed(false);
        setSubtasks(false);
    }
    function isActive(field) { return FIELDS[fieldIdx] === field; }
    function checkbox(checked) { return checked ? '[✓]' : '[ ]'; }
    function radio(value, current) { return value === current ? '●' : '○'; }
    const selectedList = lists[listIdx];
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Filters" }), _jsx(Text, { color: "gray", dimColor: true, children: "\u2191\u2193 navigate  \u00B7  space/enter toggle  \u00B7  esc cancel" }), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsxs(Text, { color: isActive('scope') ? 'cyan' : 'gray', bold: isActive('scope'), children: [isActive('scope') ? '▶ ' : '  ', "Scope    ", '  '] }), _jsxs(Text, { color: scope === 'me' ? 'cyan' : 'gray', children: [radio('me', scope), " My tasks  "] }), _jsxs(Text, { color: scope === 'list' ? 'cyan' : 'gray', children: [radio('list', scope), " List  "] }), _jsxs(Text, { color: scope === 'all' ? 'cyan' : 'gray', children: [radio('all', scope), " All team"] })] }), scope === 'list' && (_jsxs(Box, { children: [_jsxs(Text, { color: isActive('list') ? 'cyan' : 'gray', bold: isActive('list'), children: [isActive('list') ? '▶ ' : '  ', "List     ", '  '] }), _jsx(Text, { color: "white", children: selectedList ? selectedList.name : 'No lists found' }), lists.length > 1 && (_jsx(Text, { color: "gray", dimColor: true, children: "  \u2190 \u2192 to change" }))] })), _jsx(Text, { children: " " }), _jsx(Text, { color: "gray", dimColor: true, children: "  Status" }), [
                ['status_todo', 'to do', 'to do'],
                ['status_inprogress', 'in progress', 'in progress'],
                ['status_review', 'in review', 'in review'],
                ['status_done', 'done', 'done'],
            ].map(([field, label, key]) => (_jsxs(Box, { children: [_jsx(Text, { color: isActive(field) ? 'cyan' : 'gray', bold: isActive(field), children: isActive(field) ? '▶ ' : '  ' }), _jsxs(Text, { color: statuses.has(key) ? 'white' : 'gray', children: [checkbox(statuses.has(key)), " ", label] })] }, field))), _jsx(Text, { children: " " }), _jsx(Text, { color: "gray", dimColor: true, children: "  Priority" }), [
                ['priority_urgent', 'urgent', '1'],
                ['priority_high', 'high', '2'],
                ['priority_normal', 'normal', '3'],
                ['priority_low', 'low', '4'],
            ].map(([field, label, key]) => (_jsxs(Box, { children: [_jsx(Text, { color: isActive(field) ? 'cyan' : 'gray', bold: isActive(field), children: isActive(field) ? '▶ ' : '  ' }), _jsxs(Text, { color: priorities.has(key) ? 'white' : 'gray', children: [checkbox(priorities.has(key)), " ", label] })] }, field))), _jsx(Text, { children: " " }), _jsxs(Box, { children: [_jsx(Text, { color: isActive('closed') ? 'cyan' : 'gray', bold: isActive('closed'), children: isActive('closed') ? '▶ ' : '  ' }), _jsxs(Text, { color: includeClosed ? 'white' : 'gray', children: [checkbox(includeClosed), " include closed"] })] }), _jsxs(Box, { children: [_jsx(Text, { color: isActive('subtasks') ? 'cyan' : 'gray', bold: isActive('subtasks'), children: isActive('subtasks') ? '▶ ' : '  ' }), _jsxs(Text, { color: subtasks ? 'white' : 'gray', children: [checkbox(subtasks), " include subtasks"] })] }), _jsx(Text, { children: " " }), _jsxs(Box, { gap: 2, children: [_jsxs(Text, { color: isActive('apply') ? 'green' : 'gray', bold: isActive('apply'), children: [isActive('apply') ? '▶ ' : '  ', "[Apply]"] }), _jsxs(Text, { color: isActive('reset') ? 'yellow' : 'gray', bold: isActive('reset'), children: [isActive('reset') ? '▶ ' : '  ', "[Reset]"] })] })] }));
}
