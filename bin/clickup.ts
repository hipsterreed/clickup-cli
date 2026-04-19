#!/usr/bin/env node
import { Command } from 'commander';
import { render } from 'ink';
import chalk from 'chalk';
import React from 'react';
import { isConfigured, getConfig, clearConfig } from '../src/config/config.js';
import { requireConfig } from '../src/utils/guards.js';
import SetupApp from '../src/apps/SetupApp.js';
import TasksApp from '../src/apps/TasksApp.js';
import { QuickTaskList, QuickTaskDetail } from '../src/apps/QuickApp.js';
import { getTeamTasks, getListTasks, getTask, updateTaskStatus, updateTaskParent, createTask } from '../src/api/tasks.js';
import { getTaskComments, postComment } from '../src/api/comments.js';
import { getSpaces } from '../src/api/spaces.js';
import { getFolders } from '../src/api/folders.js';
import { getListsInSpace, getListsInFolder } from '../src/api/lists.js';
import type { TaskFilters, ClickUpTask, ClickUpComment } from '../src/types/clickup.js';

const program = new Command();

program
  .name('clickup')
  .description('A beautiful TUI for ClickUp')
  .version('1.0.0');

// ── JSON output helpers ───────────────────────────────────────────────────────

function outputJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

function outputJsonError(msg: string) {
  process.stderr.write(JSON.stringify({ error: msg }) + '\n');
  process.exit(1);
}

function taskToJson(t: ClickUpTask) {
  return {
    id: t.id,
    name: t.name,
    status: t.status.status,
    priority: t.priority?.priority ?? null,
    assignees: t.assignees.map((a) => ({ id: a.id, username: a.username })),
    list: { id: t.list.id, name: t.list.name },
    folder: t.folder ? { id: t.folder.id, name: t.folder.name } : null,
    due_date: t.due_date ? new Date(parseInt(t.due_date)).toISOString() : null,
    date_created: new Date(parseInt(t.date_created)).toISOString(),
    date_updated: new Date(parseInt(t.date_updated)).toISOString(),
    url: t.url,
    description: t.description ?? null,
    tags: t.tags?.map((tag) => tag.name) ?? [],
    parent: t.parent ?? null,
  };
}

function commentToJson(c: ClickUpComment) {
  return {
    id: c.id,
    text: c.comment_text,
    author: { id: c.user.id, username: c.user.username },
    date: new Date(parseInt(c.date)).toISOString(),
    resolved: c.resolved,
  };
}

// ── help ─────────────────────────────────────────────────────────────────────

program
  .command('help', { isDefault: false })
  .description('Show a full command and keybinding reference')
  .option('--llm', 'Output a plain-text JSON-mode reference for LLM consumption')
  .action((opts) => {
    if (opts.llm) {
      printLlmHelp();
      return;
    }
    const c = chalk;
    const h = (s: string) => c.bold.cyan(s);
    const k = (s: string) => c.cyan(s.padEnd(36));
    const cmd = (s: string) => c.green(s.padEnd(52));
    const dim = (s: string) => c.gray(s);

    console.log();
    console.log(h('  ClickUp CLI — Command Reference'));
    console.log(c.gray('  ─────────────────────────────────────────────────────────'));
    console.log();

    console.log(h('  Setup & Auth'));
    console.log(`  ${cmd('clickup setup')}${dim('Guided TUI setup wizard')}`);
    console.log(`  ${cmd('clickup setup --token <tk> --team <id>')}${dim('Non-interactive setup')}`);
    console.log(`  ${cmd('clickup whoami')}${dim('Show current user and workspace')}`);
    console.log(`  ${cmd('clickup whoami --json')}${dim('Output as JSON')}`);
    console.log(`  ${cmd('clickup logout')}${dim('Remove stored credentials')}`);
    console.log();

    console.log(h('  Discovery (LLM-friendly)'));
    console.log(`  ${cmd('clickup spaces [--json]')}${dim('List all spaces in your workspace')}`);
    console.log(`  ${cmd('clickup lists [--json]')}${dim('List all lists across all spaces')}`);
    console.log(`  ${cmd('clickup lists --space <id> [--json]')}${dim('Lists in a specific space')}`);
    console.log(`  ${cmd('clickup lists --folder <id> [--json]')}${dim('Lists in a specific folder')}`);
    console.log();

    console.log(h('  Tasks'));
    console.log(`  ${cmd('clickup tasks')}${dim('Launch TUI browser (browse → list → detail)')}`);
    console.log(`  ${cmd('clickup tasks --me')}${dim('My tasks (non-interactive table)')}`);
    console.log(`  ${cmd('clickup tasks --me --json')}${dim('My tasks as JSON')}`);
    console.log(`  ${cmd('clickup tasks --list <id>')}${dim('Tasks in a specific list')}`);
    console.log(`  ${cmd('clickup tasks --list <id> --json')}${dim('Tasks as JSON')}`);
    console.log(`  ${cmd('clickup tasks --status "in progress"')}${dim('Filter by status')}`);
    console.log(`  ${cmd('clickup tasks --priority 1 --priority 2')}${dim('Filter by priority (repeatable)')}`);
    console.log(`  ${cmd('clickup tasks --include-closed')}${dim('Include closed/done tasks')}`);
    console.log(`  ${cmd('clickup tasks --desc')}${dim('Show descriptions in output')}`);
    console.log(`  ${cmd('clickup tasks --order-by due_date')}${dim('Sort: created|updated|due_date')}`);
    console.log();

    console.log(h('  Single Task'));
    console.log(`  ${cmd('clickup tasks view <id>')}${dim('View task details')}`);
    console.log(`  ${cmd('clickup tasks view <id> --comments')}${dim('View task with comments')}`);
    console.log(`  ${cmd('clickup tasks view <id> --json')}${dim('Task as JSON')}`);
    console.log(`  ${cmd('clickup tasks view <id> --comments --json')}${dim('Task + comments as JSON')}`);
    console.log(`  ${cmd('clickup tasks status <id> "in review"')}${dim('Update task status')}`);
    console.log(`  ${cmd('clickup tasks status <id> "in review" --json')}${dim('Output updated task as JSON')}`);
    console.log(`  ${cmd('clickup tasks comment <id> -m "text"')}${dim('Post a comment')}`);
    console.log(`  ${cmd('clickup tasks comment <id> -m "text" --json')}${dim('Output result as JSON')}`);
    console.log();

    console.log(h('  Create'));
    console.log(`  ${cmd('clickup tasks create --list <id>')}${dim('Create task (TUI form)')}`);
    console.log(`  ${cmd('clickup tasks create --list <id> --name "x"')}${dim('Create task (non-interactive)')}`);
    console.log(`  ${cmd('  --desc "..." --priority 2 --status "to do" --due 2026-04-15')}`);
    console.log(`  ${cmd('clickup tasks create --list <id> --name "x" --json')}${dim('Output created task as JSON')}`);
    console.log();

    console.log(h('  TUI Keybindings — Split Pane'));
    console.log(`  ${k('↑ ↓')}${dim('Navigate tasks')}`);
    console.log(`  ${k('enter')}${dim('Expand to full-screen detail')}`);
    console.log(`  ${k('n')}${dim('New task (list context only)')}`);
    console.log(`  ${k('s')}${dim('Change status')}`);
    console.log(`  ${k('c')}${dim('Add comment')}`);
    console.log(`  ${k('f')}${dim('Filter panel')}`);
    console.log(`  ${k('r')}${dim('Refresh')}`);
    console.log(`  ${k('b / esc')}${dim('Back to browse')}`);
    console.log(`  ${k('? / h')}${dim('Keyboard reference overlay')}`);
    console.log(`  ${k('q')}${dim('Quit')}`);
    console.log();

    console.log(h('  TUI Keybindings — Full-Screen View'));
    console.log(`  ${k('s')}${dim('Change status')}`);
    console.log(`  ${k('c')}${dim('Add comment')}`);
    console.log(`  ${k('esc / b')}${dim('Back to list')}`);
    console.log(`  ${k('q')}${dim('Quit')}`);
    console.log();

    console.log(c.gray('  Config is stored in your OS user config directory — never in this repo.'));
    console.log(c.gray('  For full flag docs: clickup <command> --help'));
    console.log(c.gray('  For LLM/JSON mode reference: clickup help --llm'));
    console.log();
  });

function printLlmHelp() {
  const out = `
ClickUp CLI — JSON Mode Reference for LLMs
===========================================
All commands below output clean JSON to stdout. Errors go to stderr as {"error":"<message>"}.
Authentication is pre-configured; no credentials needed at runtime.

DISCOVERY
---------
List all spaces (get space IDs):
  clickup spaces --json
  Output: [{ "id": string, "name": string }, ...]

List all lists in the workspace (get list IDs):
  clickup lists --json
  Output: [{ "id": string, "name": string, "task_count": number|null,
             "space": { "id": string, "name": string },
             "folder": { "id": string, "name": string } | null }, ...]

List lists scoped to a space:
  clickup lists --space <spaceId> --json

List lists scoped to a folder:
  clickup lists --folder <folderId> --json

QUERYING TASKS
--------------
Get tasks assigned to the current user:
  clickup tasks --me --json

Get tasks in a specific list:
  clickup tasks --list <listId> --json

Filter by status (repeatable):
  clickup tasks --list <listId> --status "in progress" --status "in review" --json

Filter by priority (1=urgent 2=high 3=normal 4=low, repeatable):
  clickup tasks --list <listId> --priority 1 --priority 2 --json

Include closed/done tasks:
  clickup tasks --list <listId> --include-closed --json

Limit results:
  clickup tasks --me --limit 20 --json

Sort order:
  clickup tasks --me --order-by due_date --json   (created|updated|due_date)

Task object shape:
  {
    "id": string,            // use this ID for view/comment/status commands
    "name": string,
    "status": string,        // e.g. "in progress", "in review", "done"
    "priority": string|null, // "urgent"|"high"|"normal"|"low"|null
    "assignees": [{ "id": number, "username": string }],
    "list": { "id": string, "name": string },
    "folder": { "id": string, "name": string } | null,
    "due_date": string|null, // ISO 8601
    "date_created": string,  // ISO 8601
    "date_updated": string,  // ISO 8601
    "url": string,
    "description": string|null,
    "tags": string[],
    "parent": string|null    // parent task ID for subtasks
  }

VIEWING A TASK
--------------
Get full task details:
  clickup tasks view <taskId> --json
  Output: { "task": <task object>, "comments": [] }

Get task with comments:
  clickup tasks view <taskId> --comments --json
  Output: { "task": <task object>, "comments": [<comment>, ...] }

Comment object shape:
  {
    "id": string,
    "text": string,
    "author": { "id": number, "username": string },
    "date": string,   // ISO 8601
    "resolved": boolean
  }

POSTING A COMMENT
-----------------
  clickup tasks comment <taskId> -m "Your comment text here" --json
  Output: { "success": true, "task_id": string }

UPDATING STATUS
---------------
  clickup tasks status <taskId> "new status" --json
  Output: <full task object> (same shape as above)

SETTING A PARENT (make a task a subtask)
-----------------------------------------
  clickup tasks parent <taskId> <parentTaskId> --json
  Output: <full task object> with parent field set to parentTaskId

CREATING A TASK
---------------
  clickup tasks create --list <listId> --name "Task title" --json
  clickup tasks create --list <listId> --name "Task title" --desc "Details" --priority 2 --status "to do" --due 2026-05-01 --json
  Output: <full task object>

CURRENT USER
------------
  clickup whoami --json
  Output: { "username": string, "email": string, "teamId": string, "userId": number }

TYPICAL LLM WORKFLOW
--------------------
1. clickup lists --json                              # find the list ID you want
2. clickup tasks --list <listId> --json              # browse tasks, note task IDs
3. clickup tasks view <taskId> --comments --json     # read a task in full
4. clickup tasks comment <taskId> -m "..." --json   # post a comment
5. clickup tasks status <taskId> "in review" --json  # move a task
`;
  process.stdout.write(out.trimStart());
}

// ── setup ────────────────────────────────────────────────────────────────────

program
  .command('setup')
  .description('Configure your ClickUp API token and workspace')
  .option('-t, --token <token>', 'ClickUp personal API token')
  .option('-w, --team <id>', 'Workspace (team) ID')
  .action((opts) => {
    const { clear } = render(
      React.createElement(SetupApp, {
        prefillToken: opts.token,
        prefillTeamId: opts.team,
      }),
    );
  });

// ── whoami ───────────────────────────────────────────────────────────────────

program
  .command('whoami')
  .description('Show current logged-in user and workspace')
  .option('--json', 'Output as JSON')
  .action((opts) => {
    if (!isConfigured()) {
      if (opts.json) {
        outputJsonError('Not configured. Run clickup setup first.');
      } else {
        console.log(
          chalk.yellow('Not configured.') +
            ' Run ' + chalk.cyan('clickup setup') + ' first.',
        );
      }
      return;
    }
    const cfg = getConfig();
    if (opts.json) {
      outputJson({ username: cfg.username, email: cfg.email, teamId: cfg.teamId, userId: cfg.userId });
    } else {
      console.log(
        chalk.cyan('╭──────────────────────────────────────────╮\n') +
        chalk.cyan('│') + chalk.bold(`  Logged in as: ${cfg.username}`.padEnd(42)) + chalk.cyan('│\n') +
        chalk.cyan('│') + `  Email:        ${cfg.email}`.padEnd(43) + chalk.cyan('│\n') +
        chalk.cyan('│') + `  Workspace ID: ${cfg.teamId}`.padEnd(43) + chalk.cyan('│\n') +
        chalk.cyan('╰──────────────────────────────────────────╯'),
      );
    }
  });

// ── logout ───────────────────────────────────────────────────────────────────

program
  .command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      chalk.yellow('Remove stored credentials? (y/N) '),
      (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
          clearConfig();
          console.log(chalk.green('✓ Logged out.'));
        } else {
          console.log('Cancelled.');
        }
      },
    );
  });

// ── spaces ───────────────────────────────────────────────────────────────────

program
  .command('spaces')
  .description('List all spaces in your workspace')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    requireConfig();
    const { teamId } = getConfig();
    if (!opts.json) process.stdout.write(chalk.gray('Fetching spaces...\r'));
    try {
      const spaces = await getSpaces(teamId);
      if (!opts.json) process.stdout.write('\r\x1b[K');
      if (opts.json) {
        outputJson(spaces.map((s) => ({ id: s.id, name: s.name })));
      } else {
        console.log(chalk.bold.cyan('  Spaces'));
        console.log(chalk.gray('  ' + '─'.repeat(50)));
        for (const s of spaces) {
          console.log(`  ${chalk.cyan(s.id.padEnd(20))}  ${s.name}`);
        }
        console.log();
      }
    } catch (err: unknown) {
      if (!opts.json) process.stdout.write('\r\x1b[K');
      const msg = err instanceof Error ? err.message : 'Error';
      if (opts.json) outputJsonError(msg);
      else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
    }
  });

// ── lists ────────────────────────────────────────────────────────────────────

program
  .command('lists')
  .description('List all lists in your workspace (or scoped to a space/folder)')
  .option('--space <id>', 'Scope to a specific space')
  .option('--folder <id>', 'Scope to a specific folder')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    requireConfig();
    const { teamId } = getConfig();
    if (!opts.json) process.stdout.write(chalk.gray('Fetching lists...\r'));

    try {
      type ListEntry = {
        id: string;
        name: string;
        task_count: number | null;
        space: { id: string; name: string };
        folder: { id: string; name: string } | null;
      };
      const results: ListEntry[] = [];

      if (opts.folder) {
        const lists = await getListsInFolder(opts.folder);
        for (const l of lists) {
          results.push({
            id: l.id,
            name: l.name,
            task_count: l.task_count ?? null,
            space: { id: l.space.id, name: l.space.name },
            folder: l.folder ? { id: l.folder.id, name: l.folder.name } : null,
          });
        }
      } else if (opts.space) {
        const [lists, folders] = await Promise.all([
          getListsInSpace(opts.space),
          getFolders(opts.space),
        ]);
        for (const l of lists) {
          results.push({
            id: l.id,
            name: l.name,
            task_count: l.task_count ?? null,
            space: { id: l.space.id, name: l.space.name },
            folder: null,
          });
        }
        for (const f of folders) {
          const folderLists = await getListsInFolder(f.id);
          for (const l of folderLists) {
            results.push({
              id: l.id,
              name: l.name,
              task_count: l.task_count ?? null,
              space: { id: l.space.id, name: l.space.name },
              folder: { id: f.id, name: f.name },
            });
          }
        }
      } else {
        // All spaces
        const spaces = await getSpaces(teamId);
        for (const space of spaces) {
          const [lists, folders] = await Promise.all([
            getListsInSpace(space.id),
            getFolders(space.id),
          ]);
          for (const l of lists) {
            results.push({
              id: l.id,
              name: l.name,
              task_count: l.task_count ?? null,
              space: { id: space.id, name: space.name },
              folder: null,
            });
          }
          for (const f of folders) {
            const folderLists = await getListsInFolder(f.id);
            for (const l of folderLists) {
              results.push({
                id: l.id,
                name: l.name,
                task_count: l.task_count ?? null,
                space: { id: space.id, name: space.name },
                folder: { id: f.id, name: f.name },
              });
            }
          }
        }
      }

      if (!opts.json) process.stdout.write('\r\x1b[K');

      if (opts.json) {
        outputJson(results);
      } else {
        console.log(chalk.bold.cyan('  Lists'));
        console.log(chalk.gray('  ' + '─'.repeat(80)));
        console.log(
          chalk.gray('  ' + 'ID'.padEnd(22) + 'NAME'.padEnd(32) + 'SPACE / FOLDER'),
        );
        console.log(chalk.gray('  ' + '─'.repeat(80)));
        for (const l of results) {
          const location = l.folder ? `${l.space.name} / ${l.folder.name}` : l.space.name;
          console.log(
            `  ${chalk.cyan(l.id.padEnd(22))}${l.name.padEnd(32)}${chalk.gray(location)}`,
          );
        }
        console.log();
      }
    } catch (err: unknown) {
      if (!opts.json) process.stdout.write('\r\x1b[K');
      const msg = err instanceof Error ? err.message : 'Error';
      if (opts.json) outputJsonError(msg);
      else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
    }
  });

// ── tasks ────────────────────────────────────────────────────────────────────

const tasks = program
  .command('tasks')
  .description('List and manage tasks')
  .option('--me', 'Filter: assigned to me')
  .option('--list <id>', 'Filter: tasks from a specific list')
  .option('--status <status>', 'Filter by status (repeatable)', collect, [])
  .option('--priority <1-4>', 'Filter by priority 1=urgent 4=low (repeatable)', collect, [])
  .option('--include-closed', 'Include closed tasks')
  .option('--subtasks', 'Include subtasks')
  .option('--desc', 'Show description in output')
  .option('--limit <n>', 'Max tasks to fetch', parseInt)
  .option('--order-by <field>', 'Sort: created|updated|due_date')
  .option('--json', 'Output as JSON (skips TUI rendering)')
  .action((opts) => {
    const hasFlags =
      opts.me ||
      opts.list ||
      (opts.status && opts.status.length > 0) ||
      (opts.priority && opts.priority.length > 0) ||
      opts.includeClosed ||
      opts.subtasks ||
      opts.json;

    if (hasFlags) {
      requireConfig();
      const filters: TaskFilters = {
        me: opts.me,
        listId: opts.list,
        statuses: opts.status?.length ? opts.status : undefined,
        priorities: opts.priority?.length ? opts.priority : undefined,
        includeClosed: opts.includeClosed,
        subtasks: opts.subtasks,
        orderBy: opts.orderBy,
        limit: opts.limit,
        showDesc: opts.desc,
      };
      runFlagMode(filters, opts.desc, opts.json);
    } else {
      requireConfig();
      render(React.createElement(TasksApp, {}));
    }
  });

async function runFlagMode(filters: TaskFilters, showDesc: boolean, json: boolean) {
  if (!json) process.stdout.write(chalk.gray('Fetching tasks...\r'));
  try {
    let taskList;
    if (filters.listId) {
      taskList = await getListTasks(filters.listId, filters);
    } else {
      taskList = await getTeamTasks(filters);
    }
    if (!json) process.stdout.write('\r\x1b[K');
    if (json) {
      outputJson(taskList.map(taskToJson));
    } else {
      const { unmount } = render(
        React.createElement(QuickTaskList, { tasks: taskList, showDesc }),
      );
      setTimeout(() => { unmount(); }, 100);
    }
  } catch (err: unknown) {
    if (!json) process.stdout.write('\r\x1b[K');
    const msg = err instanceof Error ? err.message : 'Error';
    if (json) outputJsonError(msg);
    else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
  }
}

// tasks view <id>
tasks
  .command('view <taskId>')
  .description('View a specific task')
  .option('--comments', 'Show comments')
  .option('--json', 'Output as JSON')
  .action(async (taskId: string, opts) => {
    requireConfig();
    try {
      if (!opts.json) console.log(chalk.gray('Loading task...'));
      const t = await getTask(taskId);
      let cmts: ClickUpComment[] | undefined;
      if (opts.comments) {
        cmts = await getTaskComments(taskId);
      }
      if (opts.json) {
        outputJson({
          task: taskToJson(t),
          comments: cmts ? cmts.map(commentToJson) : [],
        });
      } else {
        const { unmount } = render(
          React.createElement(QuickTaskDetail, { task: t, showComments: opts.comments }),
        );
        if (cmts && cmts.length > 0) {
          setTimeout(() => {
            console.log('\nComments:');
            for (const c of cmts!) {
              const date = new Date(parseInt(c.date)).toLocaleDateString();
              console.log(chalk.gray(`[${c.user.username} — ${date}]`) + ' ' + c.comment_text);
            }
          }, 50);
        }
        setTimeout(() => unmount(), 200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (opts.json) outputJsonError(msg);
      else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
    }
  });

// tasks status <id> [status]
tasks
  .command('status [taskId] [status]')
  .description('Change the status of a task')
  .option('--json', 'Output updated task as JSON')
  .action(async (taskId?: string, status?: string, opts?: { json?: boolean }) => {
    requireConfig();
    if (taskId && status) {
      try {
        const updated = await updateTaskStatus(taskId, status);
        if (opts?.json) {
          outputJson(taskToJson(updated));
        } else {
          console.log(chalk.green(`✓ Status updated to "${status}"`));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error';
        if (opts?.json) outputJsonError(msg);
        else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
      }
    } else {
      render(React.createElement(TasksApp, {
        initialFilters: taskId
          ? { me: false }
          : { me: true },
      }));
    }
  });

// tasks parent <taskId> <parentTaskId>
tasks
  .command('parent <taskId> <parentTaskId>')
  .description('Make a task a subtask of another task')
  .option('--json', 'Output updated task as JSON')
  .action(async (taskId: string, parentTaskId: string, opts) => {
    requireConfig();
    try {
      const updated = await updateTaskParent(taskId, parentTaskId);
      if (opts.json) {
        outputJson(taskToJson(updated));
      } else {
        console.log(chalk.green(`✓ Task "${updated.name}" is now a subtask of ${parentTaskId}`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (opts.json) outputJsonError(msg);
      else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
    }
  });

// tasks create
tasks
  .command('create')
  .description('Create a new task in a list')
  .requiredOption('--list <id>', 'List ID to create the task in')
  .option('--name <title>', 'Task name')
  .option('--desc <text>', 'Task description')
  .option('--priority <1-4>', 'Priority: 1=urgent 2=high 3=normal 4=low', parseInt)
  .option('--status <status>', 'Initial status')
  .option('--due <YYYY-MM-DD>', 'Due date')
  .option('--json', 'Output created task as JSON')
  .action(async (opts: {
    list: string;
    name?: string;
    desc?: string;
    priority?: number;
    status?: string;
    due?: string;
    json?: boolean;
  }) => {
    requireConfig();

    if (opts.name) {
      try {
        let dueDateMs: number | undefined;
        if (opts.due) {
          dueDateMs = new Date(opts.due).getTime();
          if (isNaN(dueDateMs)) {
            if (opts.json) outputJsonError('Invalid due date. Use YYYY-MM-DD format.');
            else { console.error(chalk.red('✗ Invalid due date. Use YYYY-MM-DD format.')); process.exit(1); }
          }
        }
        const task = await createTask(opts.list, {
          name: opts.name,
          description: opts.desc,
          status: opts.status,
          priority: opts.priority,
          dueDate: dueDateMs,
        });
        if (opts.json) {
          outputJson(taskToJson(task));
        } else {
          console.log(chalk.green(`✓ Task created: "${task.name}" (${task.id})`));
          console.log(chalk.gray(`  Status: ${task.status.status}  ·  List: ${task.list.name}`));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error';
        if (opts.json) outputJsonError(msg);
        else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
      }
    } else {
      render(React.createElement(TasksApp, { initialFilters: { listId: opts.list } }));
    }
  });

// tasks comment <id>
tasks
  .command('comment [taskId]')
  .description('Add a comment to a task')
  .option('-m, --message <text>', 'Comment text (skip interactive input)')
  .option('--json', 'Output result as JSON')
  .action(async (taskId?: string, opts?: { message?: string; json?: boolean }) => {
    requireConfig();
    if (taskId && opts?.message) {
      try {
        await postComment(taskId, opts.message);
        if (opts?.json) {
          outputJson({ success: true, task_id: taskId });
        } else {
          console.log(chalk.green('✓ Comment posted.'));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error';
        if (opts?.json) outputJsonError(msg);
        else { console.error(chalk.red('✗ ' + msg)); process.exit(1); }
      }
    } else {
      render(React.createElement(TasksApp, {}));
    }
  });

// ── first-run guard ───────────────────────────────────────────────────────────

if (process.argv.length <= 2) {
  if (!isConfigured()) {
    console.log(chalk.yellow('Welcome to ClickUp CLI! Let\'s get you set up.\n'));
    render(React.createElement(SetupApp, {}));
  } else {
    render(React.createElement(TasksApp, {}));
  }
} else {
  program.parse(process.argv);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function collect(val: string, prev: string[]): string[] {
  return prev.concat([val]);
}
