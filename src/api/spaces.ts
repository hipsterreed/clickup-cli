import type { ClickUpSpace } from '../types/clickup.js';
import { createClient } from './client.js';

export async function getSpaces(teamId: string): Promise<ClickUpSpace[]> {
  const client = createClient();
  const res = await client.get<{ spaces: ClickUpSpace[] }>(
    `/team/${teamId}/space`,
    { params: { archived: false } },
  );
  return res.data.spaces;
}
