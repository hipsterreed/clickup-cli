import type { ClickUpComment } from '../types/clickup.js';
import { createClient } from './client.js';

export async function getTaskComments(taskId: string): Promise<ClickUpComment[]> {
  const client = createClient();
  const res = await client.get<{ comments: ClickUpComment[] }>(
    `/task/${taskId}/comment`,
  );
  return res.data.comments;
}

export async function postComment(
  taskId: string,
  text: string,
): Promise<void> {
  const client = createClient();
  await client.post(`/task/${taskId}/comment`, {
    comment_text: text,
    notify_all: false,
  });
}
