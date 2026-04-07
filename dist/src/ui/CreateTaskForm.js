import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
const FIELDS = ['name', 'description', 'priority', 'status', 'dueDate', 'submit', 'cancel'];
const TEXT_FIELDS = ['name', 'description', 'dueDate'];
const PRIORITIES = [
    { id: null, label: 'none', color: 'gray' },
    { id: 1, label: 'urgent', color: 'red' },
    { id: 2, label: 'high', color: 'red' },
    { id: 3, label: 'normal', color: 'yellow' },
    { id: 4, label: 'low', color: 'gray' },
];
export default function CreateTaskForm({ listName, listStatuses, onSubmit, onCancel, }) {
    const [fieldIdx, setFieldIdx] = useState(0);
    const [editing, setEditing] = useState('name'); // start editing name immediately
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priorityIdx, setPriorityIdx] = useState(0); // index into PRIORITIES
    const [statusIdx, setStatusIdx] = useState(0); // index into listStatuses (0 = none/default)
    const [dueDate, setDueDate] = useState('');
    const [dueDateError, setDueDateError] = useState('');
    const activeField = FIELDS[fieldIdx];
    const statuses = [{ status: '(default)', color: '' }, ...listStatuses];
    useInput((input, key) => {
        // While editing a text field, only handle esc/enter
        if (editing && TEXT_FIELDS.includes(editing)) {
            if (key.escape) {
                setEditing(null);
            }
            else if (key.return) {
                if (editing === 'dueDate')
                    validateDueDate(dueDate);
                setEditing(null);
                // advance to next field
                setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
            }
            return; // let TextInput handle the rest
        }
        // Navigation
        if (key.upArrow) {
            setFieldIdx((i) => Math.max(0, i - 1));
            return;
        }
        if (key.downArrow) {
            setFieldIdx((i) => Math.min(FIELDS.length - 1, i + 1));
            return;
        }
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return || input === ' ') {
            switch (activeField) {
                case 'name':
                case 'description':
                case 'dueDate':
                    setEditing(activeField);
                    break;
                case 'priority':
                    // cycle on space/enter; left/right handled below
                    setPriorityIdx((i) => (i + 1) % PRIORITIES.length);
                    break;
                case 'status':
                    setStatusIdx((i) => (i + 1) % statuses.length);
                    break;
                case 'submit':
                    handleSubmit();
                    break;
                case 'cancel':
                    onCancel();
                    break;
            }
            return;
        }
        // Left/right for cycling pickers
        if (activeField === 'priority') {
            if (key.leftArrow)
                setPriorityIdx((i) => (i - 1 + PRIORITIES.length) % PRIORITIES.length);
            if (key.rightArrow)
                setPriorityIdx((i) => (i + 1) % PRIORITIES.length);
        }
        if (activeField === 'status') {
            if (key.leftArrow)
                setStatusIdx((i) => (i - 1 + statuses.length) % statuses.length);
            if (key.rightArrow)
                setStatusIdx((i) => (i + 1) % statuses.length);
        }
    });
    function validateDueDate(val) {
        if (!val) {
            setDueDateError('');
            return true;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            setDueDateError('Use YYYY-MM-DD format');
            return false;
        }
        const d = new Date(val);
        if (isNaN(d.getTime())) {
            setDueDateError('Invalid date');
            return false;
        }
        setDueDateError('');
        return true;
    }
    function handleSubmit() {
        if (!name.trim()) {
            setFieldIdx(0);
            setEditing('name');
            return;
        }
        if (!validateDueDate(dueDate)) {
            setFieldIdx(FIELDS.indexOf('dueDate'));
            return;
        }
        const selectedPriority = PRIORITIES[priorityIdx];
        const selectedStatus = statuses[statusIdx];
        let dueDateMs;
        if (dueDate) {
            dueDateMs = new Date(dueDate).getTime();
        }
        onSubmit({
            name: name.trim(),
            description: description.trim(),
            priority: selectedPriority.id,
            status: selectedStatus.status === '(default)' ? null : selectedStatus.status,
            dueDate: dueDate,
        });
    }
    function isActive(f) { return activeField === f; }
    function rowPrefix(f) {
        return (_jsx(Text, { color: isActive(f) ? 'cyan' : 'gray', bold: isActive(f), children: isActive(f) ? '▶ ' : '  ' }));
    }
    function label(text) {
        return _jsx(Text, { color: "gray", children: text.padEnd(13) });
    }
    const selectedPri = PRIORITIES[priorityIdx];
    const selectedStatus = statuses[statusIdx];
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, color: "cyan", children: "Create Task" }), _jsxs(Text, { color: "gray", dimColor: true, children: ["List: ", listName] }), _jsx(Text, { color: "gray", dimColor: true, children: "\u2191\u2193 navigate  \u00B7  enter edit/confirm  \u00B7  \u2190\u2192 cycle options  \u00B7  esc cancel" })] }), _jsxs(Box, { children: [rowPrefix('name'), label('Name *'), editing === 'name' ? (_jsx(TextInput, { value: name, onChange: setName, onSubmit: () => { setEditing(null); setFieldIdx(1); }, placeholder: "Task name..." })) : (_jsx(Text, { color: name ? 'white' : 'gray', dimColor: !name, children: name || '(required — press enter to edit)' }))] }), _jsxs(Box, { children: [rowPrefix('description'), label('Description'), editing === 'description' ? (_jsx(TextInput, { value: description, onChange: setDescription, onSubmit: () => { setEditing(null); setFieldIdx(2); }, placeholder: "Optional description..." })) : (_jsx(Text, { color: description ? 'white' : 'gray', dimColor: !description, children: description || '(optional)' }))] }), _jsxs(Box, { children: [rowPrefix('priority'), label('Priority'), _jsx(Box, { gap: 1, children: PRIORITIES.map((p, i) => (_jsx(Text, { color: i === priorityIdx ? p.color : 'gray', bold: i === priorityIdx, inverse: i === priorityIdx && isActive('priority'), children: p.label }, p.label))) })] }), listStatuses.length > 0 && (_jsxs(Box, { children: [rowPrefix('status'), label('Status'), _jsx(Box, { gap: 1, children: statuses.map((s, i) => (_jsx(Text, { color: i === statusIdx ? 'cyan' : 'gray', bold: i === statusIdx, inverse: i === statusIdx && isActive('status'), children: s.status }, s.status))) })] })), _jsxs(Box, { children: [rowPrefix('dueDate'), label('Due date'), editing === 'dueDate' ? (_jsx(TextInput, { value: dueDate, onChange: setDueDate, onSubmit: () => { validateDueDate(dueDate); setEditing(null); setFieldIdx(FIELDS.indexOf('submit')); }, placeholder: "YYYY-MM-DD" })) : (_jsxs(Box, { children: [_jsx(Text, { color: dueDate ? 'white' : 'gray', dimColor: !dueDate, children: dueDate || '(optional)' }), dueDateError && _jsxs(Text, { color: "red", children: ["  ", dueDateError] })] }))] }), _jsxs(Box, { marginTop: 1, gap: 2, children: [_jsxs(Box, { children: [rowPrefix('submit'), _jsx(Text, { color: isActive('submit') ? 'green' : 'gray', bold: isActive('submit'), inverse: isActive('submit'), children: ' Create Task ' })] }), _jsxs(Box, { children: [rowPrefix('cancel'), _jsx(Text, { color: isActive('cancel') ? 'red' : 'gray', bold: isActive('cancel'), children: "Cancel" })] })] }), !name.trim() && isActive('submit') && (_jsx(Text, { color: "red", children: "  Task name is required." }))] }));
}
