import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useState, useEffect, useCallback } from 'react';
import Spinner from '../ui/Spinner.js';
import TaskTable from '../ui/TaskTable.js';
import TaskDetail from '../ui/TaskDetail.js';
import StatusPicker from '../ui/StatusPicker.js';
import CommentInput from '../ui/CommentInput.js';
import FilterPanel from '../ui/FilterPanel.js';
import BrowseScreen from '../ui/BrowseScreen.js';
import CreateTaskForm from '../ui/CreateTaskForm.js';
import HelpScreen from '../ui/HelpScreen.js';
import { getList } from '../api/lists.js';
import { getTeamTasks, getListTasks, updateTaskStatus, createTask } from '../api/tasks.js';
import { getTaskComments, postComment } from '../api/comments.js';
import { getSpaces } from '../api/spaces.js';
import { getListsInSpace, getListsInFolder } from '../api/lists.js';
import { getFolders } from '../api/folders.js';
import { getConfig } from '../config/config.js';
export default function TasksApp({ initialFilters }) {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const termRows = stdout?.rows ?? 30;
    // Layout budget:
    // 1 title bar + 1 blank gap + panels + 1 blank gap + 1 footer = 4 overhead rows
    // Each border box uses 2 rows (top+bottom border), panels share a row if side-by-side
    // Target: left panel inner height = right panel inner height = panelInnerHeight
    const OVERHEAD = 6; // title(1) + gaps(2) + footer(1) + border top+bottom(2)
    const panelInnerHeight = Math.max(8, termRows - OVERHEAD);
    // Table rows = panelInnerHeight - header row(1) - scroll indicator(1) - padding(1)
    const tableRows = Math.max(4, panelInnerHeight - 3);
    const { teamId } = getConfig();
    const [mode, setMode] = useState(initialFilters ? 'loading' : 'browse');
    const [scopeLabel, setScopeLabel] = useState('');
    const [tasks, setTasks] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [filters, setFilters] = useState(initialFilters ?? {});
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(null);
    // For fullscreen mode comments
    const [comments, setComments] = useState(null);
    const [loadingComments, setLoadingComments] = useState(false);
    // For filter panel
    const [lists, setLists] = useState([]);
    const [spaces, setSpaces] = useState([]);
    // For status picker overlay
    const [listStatuses, setListStatuses] = useState([]);
    // For create task form
    const [createListStatuses, setCreateListStatuses] = useState([]);
    const [createListName, setCreateListName] = useState('');
    // For action loading indicator
    const [actionMsg, setActionMsg] = useState('');
    const selectedTask = tasks[selectedIdx] ?? null;
    // ── Fetch tasks ───────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async (f) => {
        setMode('loading');
        setComments(null);
        setSelectedIdx(0);
        try {
            const result = f.listId
                ? await getListTasks(f.listId, f)
                : await getTeamTasks(f);
            setTasks(result);
            setMode('split');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
            setMode('error');
        }
    }, []);
    // Load lists/spaces for filter panel (background, non-blocking)
    const fetchFilterData = useCallback(async () => {
        try {
            const sp = await getSpaces(teamId);
            setSpaces(sp);
            const allLists = [];
            for (const space of sp) {
                try {
                    allLists.push(...(await getListsInSpace(space.id)));
                    const folders = await getFolders(space.id);
                    for (const folder of folders) {
                        allLists.push(...(await getListsInFolder(folder.id)));
                    }
                }
                catch { /* skip */ }
            }
            setLists(allLists);
        }
        catch { /* optional */ }
    }, [teamId]);
    // Initial load when initialFilters provided
    useEffect(() => {
        if (initialFilters) {
            fetchTasks(initialFilters);
            fetchFilterData();
        }
    }, []);
    // Load comments when entering fullscreen
    useEffect(() => {
        if (mode !== 'fullscreen' || !selectedTask)
            return;
        let cancelled = false;
        setLoadingComments(true);
        setComments(null);
        getTaskComments(selectedTask.id)
            .then((c) => { if (!cancelled) {
            setComments(c);
            setLoadingComments(false);
        } })
            .catch(() => { if (!cancelled) {
            setComments([]);
            setLoadingComments(false);
        } });
        return () => { cancelled = true; };
    }, [mode, selectedTask?.id]);
    // ── Notice ────────────────────────────────────────────────────────────────
    function showNotice(message, type = 'success') {
        setNotice({ message, type });
        setTimeout(() => setNotice(null), 3000);
    }
    // ── Keyboard ─────────────────────────────────────────────────────────────
    useInput((input, key) => {
        if (input === 'q' && mode !== 'comment') {
            exit();
            return;
        }
        // Help toggle from any non-input mode
        if ((input === '?' || input === 'h') && mode !== 'comment' && mode !== 'create') {
            setMode((m) => m === 'help' ? 'split' : 'help');
            return;
        }
        if (mode === 'split') {
            if (key.return) {
                setMode('fullscreen');
            }
            else if (input === 'n') {
                openCreateForm();
            }
            else if (input === 's') {
                openStatusPicker();
            }
            else if (input === 'c') {
                setMode('comment');
            }
            else if (input === 'f') {
                fetchFilterData(); // lazy-load filter data
                setMode('filter');
            }
            else if (input === 'r') {
                fetchTasks(filters);
            }
            else if (key.escape || input === 'b') {
                setMode('browse');
            }
        }
        if (mode === 'fullscreen') {
            if (key.escape || key.leftArrow || input === 'b') {
                setMode('split');
                setComments(null);
            }
            else if (input === 's') {
                openStatusPicker();
            }
            else if (input === 'c') {
                setMode('comment');
            }
        }
        if (mode === 'error' && key.return) {
            fetchTasks(filters);
        }
    });
    // ── Actions ───────────────────────────────────────────────────────────────
    function openStatusPicker() {
        if (!selectedTask)
            return;
        // Collect statuses from all tasks in current result set
        const seen = new Map();
        for (const t of tasks) {
            if (!seen.has(t.status.status))
                seen.set(t.status.status, t.status);
        }
        setListStatuses([...seen.values()]);
        setMode('status');
    }
    async function handleStatusConfirm(status) {
        if (!selectedTask)
            return;
        setMode('split');
        setActionMsg('Updating status...');
        try {
            await updateTaskStatus(selectedTask.id, status);
            setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, status: { ...t.status, status } } : t));
            showNotice(`✓ Status updated to "${status}"`);
        }
        catch (err) {
            showNotice(err instanceof Error ? err.message : 'Failed to update status', 'error');
        }
        finally {
            setActionMsg('');
        }
    }
    async function openCreateForm() {
        // Need a list ID to create a task
        if (!filters.listId) {
            showNotice('Switch to a specific list first (use browse or filter)', 'error');
            return;
        }
        // Load list details to get statuses
        try {
            const listDetail = await getList(filters.listId);
            setCreateListStatuses(listDetail.statuses ?? []);
            setCreateListName(listDetail.name);
        }
        catch {
            setCreateListStatuses([]);
            setCreateListName(filters.listId);
        }
        setMode('create');
    }
    async function handleCreateSubmit(values) {
        if (!filters.listId)
            return;
        setMode('split');
        setActionMsg('Creating task...');
        try {
            const newTask = await createTask(filters.listId, {
                name: values.name,
                description: values.description || undefined,
                status: values.status || undefined,
                priority: values.priority ?? undefined,
                dueDate: values.dueDate ? new Date(values.dueDate).getTime() : undefined,
            });
            // Prepend new task to the list and select it
            setTasks((prev) => [newTask, ...prev]);
            setSelectedIdx(0);
            showNotice(`✓ Task "${newTask.name}" created`);
        }
        catch (err) {
            showNotice(err instanceof Error ? err.message : 'Failed to create task', 'error');
        }
        finally {
            setActionMsg('');
        }
    }
    async function handleCommentSubmit(text) {
        if (!selectedTask)
            return;
        setMode(comments !== null ? 'fullscreen' : 'split');
        setActionMsg('Posting comment...');
        try {
            await postComment(selectedTask.id, text);
            // Reload comments if we're in fullscreen
            if (mode === 'fullscreen') {
                const c = await getTaskComments(selectedTask.id);
                setComments(c);
            }
            showNotice('✓ Comment posted');
        }
        catch (err) {
            showNotice(err instanceof Error ? err.message : 'Failed to post comment', 'error');
        }
        finally {
            setActionMsg('');
        }
    }
    function handleBrowseSelect(f, label) {
        setScopeLabel(label);
        setFilters(f);
        fetchTasks(f);
        fetchFilterData();
    }
    function handleFilterApply(newFilters) {
        setFilters(newFilters);
        fetchTasks(newFilters);
    }
    // ── Render ────────────────────────────────────────────────────────────────
    // Title bar content
    const canCreate = !!filters.listId;
    const titleRight = mode === 'split'
        ? `b:back  f:filter${canCreate ? '  n:new' : ''}  r:refresh  q:quit`
        : mode === 'fullscreen'
            ? 'esc:back  s:status  c:comment  q:quit'
            : 'q:quit';
    const titleLeft = mode === 'split' || mode === 'fullscreen'
        ? `ClickUp · ${scopeLabel} · ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
        : 'ClickUp CLI';
    // ── Browse mode ───────────────────────────────────────────────────────────
    if (mode === 'browse') {
        return (_jsx(BrowseScreen, { onSelect: handleBrowseSelect, onQuit: exit }));
    }
    // ── Main layout (loading / split / fullscreen / overlays / error) ─────────
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: titleLeft }), _jsxs(Text, { color: "gray", dimColor: true, children: ['  ·  ', titleRight] })] }), notice && (_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: notice.type === 'success' ? 'green' : 'red', bold: true, children: notice.message }) })), actionMsg && (_jsx(Box, { paddingX: 1, children: _jsx(Spinner, { message: actionMsg }) })), mode === 'loading' && (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Spinner, { message: "Fetching tasks..." }) })), mode === 'error' && (_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsxs(Text, { color: "red", children: ["\u2717 ", error] }), _jsx(Text, { color: "gray", dimColor: true, children: "Press Enter to retry  \u00B7  q to quit" })] })), mode === 'split' && (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { flexDirection: "column", width: "40%", borderStyle: "round", borderColor: "gray", paddingX: 1, paddingY: 0, height: panelInnerHeight + 2, children: _jsx(TaskTable, { tasks: tasks, selectedIndex: selectedIdx, onSelect: setSelectedIdx, height: tableRows, isFocused: true }) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "gray", height: panelInnerHeight + 2, overflow: "hidden", children: _jsx(TaskDetail, { task: selectedTask, compact: true }) })] })), mode === 'status' && selectedTask && listStatuses.length > 0 && (_jsx(StatusPicker, { statuses: listStatuses, currentStatus: selectedTask.status.status, onConfirm: handleStatusConfirm, onCancel: () => setMode('split') })), mode === 'comment' && selectedTask && (_jsx(CommentInput, { onSubmit: handleCommentSubmit, onCancel: () => setMode(comments !== null ? 'fullscreen' : 'split') })), mode === 'filter' && (_jsxs(Box, { children: [_jsx(Box, { width: "45%", children: _jsx(FilterPanel, { filters: filters, lists: lists, spaces: spaces, onApply: handleFilterApply, onCancel: () => setMode('split') }) }), _jsx(Box, { flexGrow: 1, paddingLeft: 1, children: _jsx(TaskDetail, { task: selectedTask, compact: true }) })] })), mode === 'fullscreen' && selectedTask && (_jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", height: panelInnerHeight + 2, overflow: "hidden", children: _jsx(TaskDetail, { task: selectedTask, compact: false, comments: comments ?? undefined, loadingComments: loadingComments }) })), mode === 'help' && (_jsx(HelpScreen, { onClose: () => setMode('split') })), mode === 'create' && (_jsx(CreateTaskForm, { listName: createListName, listStatuses: createListStatuses, onSubmit: handleCreateSubmit, onCancel: () => setMode('split') })), mode === 'split' && (_jsx(Box, { paddingX: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: "\u2191\u2193 navigate  \u00B7  enter expand  \u00B7  n new  \u00B7  s status  \u00B7  c comment  \u00B7  f filter  \u00B7  b back  \u00B7  ? help  \u00B7  q quit" }) }))] }));
}
