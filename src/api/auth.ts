import type { ClickUpUser } from '../types/clickup.js';
import { createClientWithToken } from './client.js';

export async function getUser(token: string): Promise<ClickUpUser> {
  const client = createClientWithToken(token);
  const res = await client.get<{ user: ClickUpUser }>('/user');
  return res.data.user;
}
