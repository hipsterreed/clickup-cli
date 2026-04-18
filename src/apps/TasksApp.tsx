import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useState, useEffect, useCallback } from 'react';
import Spinner from '../ui/Spinner.js';
import TaskTable from '../ui/TaskTable.js';
import TaskDetail from '../ui/TaskDetail.js';
import StatusPicker from '../ui/StatusPicker.js';
import CommentInput from '../ui/CommentInput.js';
import FilterPanel from '../ui/FilterPanel.js';
import BrowseScreen from '../ui/BrowseScreen.js';
import CreateTaskForm, { type CreateTaskValues } from '../ui/CreateTaskForm.js';
import HelpScreen from '../ui/HelpScreen.js';
import { getList } from '../api/lists.js';
import { getTeamTasks, getListTasks, updateTaskStatus, createTask } from '../api/tasks.js';
import { getTaskComments, postComment } from '../api/comments.js';
import { getSpaces } from '../api/spaces.js';
import { getListsInSpace, getListsInFolder } from '../api/lists.js';
import { getFolders } from '../api/folders.js';
import { getConfig } from '../config/config.js';
import type {
  ClickUpTask,
  ClickUpComment,
  TaskFilters,
  ClickUpList,
  ClickUpSpace,
  ClickUpStatus,
} from '../types/clickup.js';

type Mode =
  | 'browse'      // initial list picker
  | 'loading'     // fetching tasks
  | 'split'       // main split-pane view
  | 'fullscreen'  // expanded single task (loads comments)
  | 'status'      // status picker overlay
  | 'comment'     // comment input overlay
  | 'create'      // create new task form
  | 'filter'      // filter panel overlay
  | 'help'        // keyboard reference overlay
  | 'error';

interface Notice {
  message: string;
  type: 'success' | 'error';
}

interface Props {
  /** When set, skip browse and go straight to split pane */
  initialFilters?: TaskFilters;
}

export default function TasksApp({ initialFilters }: Props) {
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

  const [mode, setMode] = useState<Mode>(initialFilters ? 'loading' : 'browse');
  const [scopeLabel, setScopeLabel] = useState('');
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters ?? {});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  // For fullscreen mode comments
  const [comments, setComments] = useState<ClickUpComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // For filter panel
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);

  // For status picker overlay
  const [listStatuses, setListStatuses] = useState<ClickUpStatus[]>([]);

  // For create task form
  const [createListStatuses, setCreateListStatuses] = useState<ClickUpStatus[]>([]);
  const [createListName, setCreateListName] = useState('');

  // For action loading indicator
  const [actionMsg, setActionMsg] = useState('');

  const selectedTask = tasks[selectedIdx] ?? null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const STATUS_TYPE_ORDER: Record<string, number> = { open: 0, custom: 1, closed: 2 };

  function sortByStatus(tasks: ClickUpTask[]): ClickUpTask[] {
    return [...tasks].sort((a, b) => {
      const typeA = STATUS_TYPE_ORDER[a.status.type] ?? 1;
      const typeB = STATUS_TYPE_ORDER[b.status.type] ?? 1;
      if (typeA !== typeB) return typeA - typeB;
      return a.status.orderindex - b.status.orderindex;
    });
  }

  // ── Fetch tasks ───────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async (f: TaskFilters) => {
    setMode('loading');
    setComments(null);
    setSelectedIdx(0);
    try {
      const result = f.listId
        ? await getListTasks(f.listId, f)
        : await getTeamTasks(f);
      setTasks(sortByStatus(result));
      setMode('split');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setMode('error');
    }
  }, []);

  // Load lists/spaces for filter panel (background, non-blocking)
  const fetchFilterData = useCallback(async () => {
    try {
      const sp = await getSpaces(teamId);
      setSpaces(sp);
      const allLists: ClickUpList[] = [];
      for (const space of sp) {
        try {
          allLists.push(...(await getListsInSpace(space.id)));
          const folders = await getFolders(space.id);
          for (const folder of folders) {
            allLists.push(...(await getListsInFolder(folder.id)));
          }
        } catch { /* skip */ }
      }
      setLists(allLists);
    } catch { /* optional */ }
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
    if (mode !== 'fullscreen' || !selectedTask) return;
    let cancelled = false;
    setLoadingComments(true);
    setComments(null);
    getTaskComments(selectedTask.id)
      .then((c) => { if (!cancelled) { setComments(c); setLoadingComments(false); } })
      .catch(() => { if (!cancelled) { setComments([]); setLoadingComments(false); } });
    return () => { cancelled = true; };
  }, [mode, selectedTask?.id]);

  // ── Notice ────────────────────────────────────────────────────────────────

  function showNotice(message: string, type: 'success' | 'error' = 'success') {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useInput((input, key) => {
    if (input === 'q' && mode !== 'comment') { exit(); return; }

    // Help toggle from any non-input mode
    if ((input === '?' || input === 'h') && mode !== 'comment' && mode !== 'create') {
      setMode((m) => m === 'help' ? 'split' : 'help');
      return;
    }

    if (mode === 'split') {
      if (key.return) {
        setMode('fullscreen');
      } else if (input === 'n') {
        openCreateForm();
      } else if (input === 's') {
        openStatusPicker();
      } else if (input === 'c') {
        setMode('comment');
      } else if (input === 'f') {
        fetchFilterData(); // lazy-load filter data
        setMode('filter');
      } else if (input === 'm') {
        const next = { ...filters, me: !filters.me };
        setFilters(next);
        fetchTasks(next);
      } else if (input === 'r') {
        fetchTasks(filters);
      } else if (key.escape || input === 'b') {
        setMode('browse');
      }
    }

    if (mode === 'fullscreen') {
      if (key.escape || key.leftArrow || input === 'b') {
        setMode('split');
        setComments(null);
      } else if (input === 's') {
        openStatusPicker();
      } else if (input === 'c') {
        setMode('comment');
      }
    }

    if (mode === 'error' && key.return) {
      fetchTasks(filters);
    }
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  function openStatusPicker() {
    if (!selectedTask) return;
    // Collect statuses from all tasks in current result set
    const seen = new Map<string, ClickUpStatus>();
    for (const t of tasks) {
      if (!seen.has(t.status.status)) seen.set(t.status.status, t.status);
    }
    setListStatuses([...seen.values()]);
    setMode('status');
  }

  async function handleStatusConfirm(status: string) {
    if (!selectedTask) return;
    setMode('split');
    setActionMsg('Updating status...');
    try {
      await updateTaskStatus(selectedTask.id, status);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...t, status: { ...t.status, status } } : t,
        ),
      );
      showNotice(`✓ Status updated to "${status}"`);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to update status', 'error');
    } finally {
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
    } catch {
      setCreateListStatuses([]);
      setCreateListName(filters.listId);
    }
    setMode('create');
  }

  async function handleCreateSubmit(values: CreateTaskValues) {
    if (!filters.listId) return;
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
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to create task', 'error');
    } finally {
      setActionMsg('');
    }
  }

  async function handleCommentSubmit(text: string) {
    if (!selectedTask) return;
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
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : 'Failed to post comment', 'error');
    } finally {
      setActionMsg('');
    }
  }

  function handleBrowseSelect(f: TaskFilters, label: string) {
    setScopeLabel(label);
    setFilters(f);
    fetchTasks(f);
    fetchFilterData();
  }

  function handleFilterApply(newFilters: TaskFilters) {
    setFilters(newFilters);
    fetchTasks(newFilters);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Title bar content
  const canCreate = !!filters.listId;
  const titleRight = mode === 'split'
    ? `m:${filters.me ? 'all' : 'mine'}  b:back  f:filter${canCreate ? '  n:new' : ''}  r:refresh  q:quit`
    : mode === 'fullscreen'
      ? 'esc:back  s:status  c:comment  q:quit'
      : 'q:quit';

  const meLabel = filters.me ? ' · me' : '';
  const titleLeft = mode === 'split' || mode === 'fullscreen'
    ? `ClickUp · ${scopeLabel}${meLabel} · ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
    : 'ClickUp CLI';

  // ── Browse mode ───────────────────────────────────────────────────────────
  if (mode === 'browse') {
    return (
      <BrowseScreen
        onSelect={handleBrowseSelect}
        onQuit={exit}
      />
    );
  }

  // ── Main layout (loading / split / fullscreen / overlays / error) ─────────
  return (
    <Box flexDirection="column">
      {/* Title bar */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">{titleLeft}</Text>
        <Text color="gray">{'  ·  '}{titleRight}</Text>
      </Box>

      {/* Notice */}
      {notice && (
        <Box paddingX={1}>
          <Text color={notice.type === 'success' ? 'green' : 'red'} bold>
            {notice.message}
          </Text>
        </Box>
      )}
      {actionMsg && (
        <Box paddingX={1}>
          <Spinner message={actionMsg} />
        </Box>
      )}

      {/* ── Loading ── */}
      {mode === 'loading' && (
        <Box paddingX={2} paddingY={1}>
          <Spinner message="Fetching tasks..." />
        </Box>
      )}

      {/* ── Error ── */}
      {mode === 'error' && (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Text color="red">✗ {error}</Text>
          <Text color="gray">Press Enter to retry  ·  q to quit</Text>
        </Box>
      )}

      {/* ── Split pane ── */}
      {mode === 'split' && (
        <Box flexDirection="row">
          {/* Left: task list */}
          <Box
            flexDirection="column"
            width={71}
            flexShrink={0}
            borderStyle="round"
            borderColor="gray"
            paddingX={1}
            paddingY={0}
            height={panelInnerHeight + 2}
          >
            <TaskTable
              tasks={tasks}
              selectedIndex={selectedIdx}
              onSelect={setSelectedIdx}
              height={tableRows}
              isFocused={true}
            />
          </Box>

          {/* Right: task detail */}
          <Box
            flexDirection="column"
            flexGrow={1}
            borderStyle="round"
            borderColor="gray"
            height={panelInnerHeight + 2}
            overflow="hidden"
          >
            <TaskDetail
              task={selectedTask}
              compact={true}
            />
          </Box>
        </Box>
      )}

      {/* ── Status overlay ── */}
      {mode === 'status' && selectedTask && listStatuses.length > 0 && (
        <StatusPicker
          statuses={listStatuses}
          currentStatus={selectedTask.status.status}
          onConfirm={handleStatusConfirm}
          onCancel={() => setMode('split')}
        />
      )}

      {/* ── Comment overlay ── */}
      {mode === 'comment' && selectedTask && (
        <CommentInput
          onSubmit={handleCommentSubmit}
          onCancel={() => setMode(comments !== null ? 'fullscreen' : 'split')}
        />
      )}

      {/* ── Filter overlay ── */}
      {mode === 'filter' && (
        <Box>
          <Box width="45%">
            <FilterPanel
              filters={filters}
              lists={lists}
              spaces={spaces}
              onApply={handleFilterApply}
              onCancel={() => setMode('split')}
            />
          </Box>
          <Box flexGrow={1} paddingLeft={1}>
            <TaskDetail task={selectedTask} compact />
          </Box>
        </Box>
      )}

      {/* ── Fullscreen task view ── */}
      {mode === 'fullscreen' && selectedTask && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="cyan"
          height={panelInnerHeight + 2}
          overflow="hidden"
        >
          <TaskDetail
            task={selectedTask}
            compact={false}
            comments={comments ?? undefined}
            loadingComments={loadingComments}
          />
        </Box>
      )}

      {/* ── Help overlay ── */}
      {mode === 'help' && (
        <HelpScreen onClose={() => setMode('split')} />
      )}

      {/* ── Create task form ── */}
      {mode === 'create' && (
        <CreateTaskForm
          listName={createListName}
          listStatuses={createListStatuses}
          onSubmit={handleCreateSubmit}
          onCancel={() => setMode('split')}
        />
      )}

      {/* Footer hint for split */}
      {mode === 'split' && (
        <Box paddingX={1}>
          <Text color="gray">
            ↑↓ navigate  ·  enter expand  ·  m mine  ·  n new  ·  s status  ·  c comment  ·  f filter  ·  b back  ·  ? help  ·  q quit
          </Text>
        </Box>
      )}
    </Box>
  );
}
