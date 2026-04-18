import type { ClickUpTask, TaskFilters } from '../types/clickup.js';
import { createClient } from './client.js';
import { getConfig } from '../config/config.js';

export async function getTeamTasks(filters: TaskFilters): Promise<ClickUpTask[]> {
  const client = createClient();
  const { teamId, userId } = getConfig();

  const params: Record<string, unknown> = {
    include_closed: filters.includeClosed ?? false,
    subtasks: filters.subtasks ?? false,
    order_by: filters.orderBy ?? 'updated',
    reverse: true,
    page: 0,
  };

  if (filters.me && userId) {
    params['assignees[]'] = [userId];
  }

  if (filters.statuses && filters.statuses.length > 0) {
    params['statuses[]'] = filters.statuses;
  }

  if (filters.priorities && filters.priorities.length > 0) {
    params['priorities[]'] = filters.priorities;
  }

  if (filters.limit) {
    params['limit'] = filters.limit;
  }

  const res = await client.get<{ tasks: ClickUpTask[] }>(
    `/team/${teamId}/task`,
    { params },
  );

  return res.data.tasks;
}

export async function getListTasks(
  listId: string,
  filters: TaskFilters,
): Promise<ClickUpTask[]> {
  const client = createClient();
  const { teamId, userId } = getConfig();

  const params: Record<string, unknown> = {
    'list_ids[]': [listId],
    include_closed: filters.includeClosed ?? false,
    subtasks: filters.subtasks ?? false,
    order_by: filters.orderBy ?? 'updated',
    reverse: true,
    page: 0,
  };

  if (filters.me && userId) {
    params['assignees[]'] = [userId];
  }

  if (filters.statuses && filters.statuses.length > 0) {
    params['statuses[]'] = filters.statuses;
  }

  if (filters.priorities && filters.priorities.length > 0) {
    params['priorities[]'] = filters.priorities;
  }

  const res = await client.get<{ tasks: ClickUpTask[] }>(
    `/team/${teamId}/task`,
    { params },
  );

  return res.data.tasks;
}

export async function getTask(taskId: string): Promise<ClickUpTask> {
  const client = createClient();
  const res = await client.get<ClickUpTask>(`/task/${taskId}`);
  return res.data;
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<ClickUpTask> {
  const client = createClient();
  const res = await client.put<ClickUpTask>(`/task/${taskId}`, { status });
  return res.data;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: string;
  priority?: number; // 1=urgent 2=high 3=normal 4=low
  dueDate?: number;  // unix ms
}

export async function createTask(
  listId: string,
  input: CreateTaskInput,
): Promise<ClickUpTask> {
  const client = createClient();
  const body: Record<string, unknown> = { name: input.name };
  if (input.description) body.description = input.description;
  if (input.status) body.status = input.status;
  if (input.priority) body.priority = input.priority;
  if (input.dueDate) body.due_date = input.dueDate;
  const res = await client.post<ClickUpTask>(`/list/${listId}/task`, body);
  return res.data;
}
