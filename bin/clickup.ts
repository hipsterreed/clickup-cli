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
import { getTeamTasks, getListTasks, getTask, updateTaskStatus, createTask } from '../src/api/tasks.js';
import { getTaskComments, postComment } from '../src/api/comments.js';
import type { TaskFilters } from '../src/types/clickup.js';

const program = new Command();

program
  .name('clickup')
  .description('A beautiful TUI for ClickUp')
  .version('1.0.0');

// ── help ─────────────────────────────────────────────────────────────────────

program
  .command('help', { isDefault: false })
  .description('Show a full command and keybinding reference')
  .action(() => {
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
    console.log(`  ${cmd('clickup logout')}${dim('Remove stored credentials')}`);
    console.log();

    console.log(h('  Tasks'));
    console.log(`  ${cmd('clickup tasks')}${dim('Launch TUI browser (browse → list → detail)')}`);
    console.log(`  ${cmd('clickup tasks --me')}${dim('My tasks (non-interactive table)')}`);
    console.log(`  ${cmd('clickup tasks --list <id>')}${dim('Tasks in a specific list')}`);
    console.log(`  ${cmd('clickup tasks --status "in progress"')}${dim('Filter by status')}`);
    console.log(`  ${cmd('clickup tasks --priority 1 --priority 2')}${dim('Filter by priority (repeatable)')}`);
    console.log(`  ${cmd('clickup tasks --include-closed')}${dim('Include closed/done tasks')}`);
    console.log(`  ${cmd('clickup tasks --desc')}${dim('Show descriptions in output')}`);
    console.log(`  ${cmd('clickup tasks --order-by due_date')}${dim('Sort: created|updated|due_date')}`);
    console.log();

    console.log(h('  Single Task'));
    console.log(`  ${cmd('clickup tasks view <id>')}${dim('View task details')}`);
    console.log(`  ${cmd('clickup tasks view <id> --comments')}${dim('View task with comments')}`);
    console.log(`  ${cmd('clickup tasks status <id> "in review"')}${dim('Update task status')}`);
    console.log(`  ${cmd('clickup tasks comment <id> -m "text"')}${dim('Post a comment')}`);
    console.log();

    console.log(h('  Create'));
    console.log(`  ${cmd('clickup tasks create --list <id>')}${dim('Create task (TUI form)')}`);
    console.log(`  ${cmd('clickup tasks create --list <id> --name "x"')}${dim('Create task (non-interactive)')}`);
    console.log(`  ${cmd('  --desc "..." --priority 2 --status "to do" --due 2026-04-15')}`);
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
    console.log();
  });

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
  .action(() => {
    if (!isConfigured()) {
      console.log(
        chalk.yellow('Not configured.') +
          ' Run ' + chalk.cyan('clickup setup') + ' first.',
      );
      return;
    }
    const cfg = getConfig();
    console.log(
      chalk.cyan('╭──────────────────────────────────────────╮\n') +
      chalk.cyan('│') + chalk.bold(`  Logged in as: ${cfg.username}`.padEnd(42)) + chalk.cyan('│\n') +
      chalk.cyan('│') + `  Email:        ${cfg.email}`.padEnd(43) + chalk.cyan('│\n') +
      chalk.cyan('│') + `  Workspace ID: ${cfg.teamId}`.padEnd(43) + chalk.cyan('│\n') +
      chalk.cyan('╰──────────────────────────────────────────╯'),
    );
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
  .action((opts) => {
    // If any filter flag given → flag mode (non-interactive)
    const hasFlags =
      opts.me ||
      opts.list ||
      (opts.status && opts.status.length > 0) ||
      (opts.priority && opts.priority.length > 0) ||
      opts.includeClosed ||
      opts.subtasks;

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
      runFlagMode(filters, opts.desc);
    } else {
      // TUI mode — open browse picker (no initialFilters = browse screen)
      requireConfig();
      render(React.createElement(TasksApp, {}));
    }
  });

async function runFlagMode(filters: TaskFilters, showDesc: boolean) {
  process.stdout.write(chalk.gray('Fetching tasks...\r'));
  try {
    let taskList;
    if (filters.listId) {
      taskList = await getListTasks(filters.listId, filters);
    } else {
      taskList = await getTeamTasks(filters);
    }
    process.stdout.write('\r\x1b[K'); // clear spinner line
    const { unmount } = render(
      React.createElement(QuickTaskList, { tasks: taskList, showDesc }),
    );
    // Give ink time to render then exit
    setTimeout(() => { unmount(); }, 100);
  } catch (err: unknown) {
    process.stdout.write('\r\x1b[K');
    console.error(chalk.red('✗ ' + (err instanceof Error ? err.message : 'Error')));
    process.exit(1);
  }
}

// tasks view <id>
tasks
  .command('view <taskId>')
  .description('View a specific task')
  .option('--comments', 'Show comments')
  .action(async (taskId: string, opts) => {
    requireConfig();
    try {
      console.log(chalk.gray('Loading task...'));
      const t = await getTask(taskId);
      let cmts;
      if (opts.comments) {
        cmts = await getTaskComments(taskId);
      }
      const { unmount } = render(
        React.createElement(QuickTaskDetail, { task: t, showComments: opts.comments }),
      );
      if (cmts && cmts.length > 0) {
        setTimeout(() => {
          console.log('\nComments:');
          for (const c of cmts) {
            const date = new Date(parseInt(c.date)).toLocaleDateString();
            console.log(chalk.gray(`[${c.user.username} — ${date}]`) + ' ' + c.comment_text);
          }
        }, 50);
      }
      setTimeout(() => unmount(), 200);
    } catch (err: unknown) {
      console.error(chalk.red('✗ ' + (err instanceof Error ? err.message : 'Error')));
      process.exit(1);
    }
  });

// tasks status <id> [status]
tasks
  .command('status [taskId] [status]')
  .description('Change the status of a task')
  .action(async (taskId?: string, status?: string) => {
    requireConfig();
    if (taskId && status) {
      // Full flag mode
      try {
        await updateTaskStatus(taskId, status);
        console.log(chalk.green(`✓ Status updated to "${status}"`));
      } catch (err: unknown) {
        console.error(chalk.red('✗ ' + (err instanceof Error ? err.message : 'Error')));
        process.exit(1);
      }
    } else {
      // TUI mode — open TasksApp with status picker hint
      render(React.createElement(TasksApp, {
        initialFilters: taskId
          ? { me: false }
          : { me: true },
      }));
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
  .action(async (opts: {
    list: string;
    name?: string;
    desc?: string;
    priority?: number;
    status?: string;
    due?: string;
  }) => {
    requireConfig();

    // Flag mode — all required info provided
    if (opts.name) {
      try {
        let dueDateMs: number | undefined;
        if (opts.due) {
          dueDateMs = new Date(opts.due).getTime();
          if (isNaN(dueDateMs)) {
            console.error(chalk.red('✗ Invalid due date. Use YYYY-MM-DD format.'));
            process.exit(1);
          }
        }
        const task = await createTask(opts.list, {
          name: opts.name,
          description: opts.desc,
          status: opts.status,
          priority: opts.priority,
          dueDate: dueDateMs,
        });
        console.log(chalk.green(`✓ Task created: "${task.name}" (${task.id})`));
        console.log(chalk.gray(`  Status: ${task.status.status}  ·  List: ${task.list.name}`));
      } catch (err: unknown) {
        console.error(chalk.red('✗ ' + (err instanceof Error ? err.message : 'Error')));
        process.exit(1);
      }
    } else {
      // TUI mode — open tasks app at that list with create form
      render(React.createElement(TasksApp, { initialFilters: { listId: opts.list } }));
    }
  });

// tasks comment <id>
tasks
  .command('comment [taskId]')
  .description('Add a comment to a task')
  .option('-m, --message <text>', 'Comment text (skip interactive input)')
  .action(async (taskId?: string, opts?: { message?: string }) => {
    requireConfig();
    if (taskId && opts?.message) {
      // Flag mode
      try {
        await postComment(taskId, opts.message);
        console.log(chalk.green('✓ Comment posted.'));
      } catch (err: unknown) {
        console.error(chalk.red('✗ ' + (err instanceof Error ? err.message : 'Error')));
        process.exit(1);
      }
    } else {
      // TUI mode — open browse picker
      render(React.createElement(TasksApp, {}));
    }
  });

// ── first-run guard ───────────────────────────────────────────────────────────

// If no subcommand given, default to browse TUI if configured, else setup
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
