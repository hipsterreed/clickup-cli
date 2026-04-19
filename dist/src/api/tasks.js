import { createClient } from './client.js';
import { getConfig } from '../config/config.js';
export async function getTeamTasks(filters) {
    const client = createClient();
    const { teamId, userId } = getConfig();
    const params = {
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
    const res = await client.get(`/team/${teamId}/task`, { params });
    return res.data.tasks;
}
export async function getListTasks(listId, filters) {
    const client = createClient();
    const { teamId, userId } = getConfig();
    const params = {
        'list_ids[]': [listId],
        include_closed: true,
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
    const res = await client.get(`/team/${teamId}/task`, { params });
    return res.data.tasks;
}
export async function getTask(taskId) {
    const client = createClient();
    const res = await client.get(`/task/${taskId}`);
    return res.data;
}
export async function updateTaskStatus(taskId, status) {
    const client = createClient();
    const res = await client.put(`/task/${taskId}`, { status });
    return res.data;
}
export async function updateTaskParent(taskId, parentTaskId) {
    const client = createClient();
    const res = await client.put(`/task/${taskId}`, { parent: parentTaskId });
    return res.data;
}
export async function createTask(listId, input) {
    const client = createClient();
    const body = { name: input.name };
    if (input.description)
        body.description = input.description;
    if (input.status)
        body.status = input.status;
    if (input.priority)
        body.priority = input.priority;
    if (input.dueDate)
        body.due_date = input.dueDate;
    const res = await client.post(`/list/${listId}/task`, body);
    return res.data;
}
