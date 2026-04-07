import type { ClickUpFolder } from '../types/clickup.js';
import { createClient } from './client.js';

export async function getFolders(spaceId: string): Promise<ClickUpFolder[]> {
  const client = createClient();
  const res = await client.get<{ folders: ClickUpFolder[] }>(
    `/space/${spaceId}/folder`,
    { params: { archived: false } },
  );
  return res.data.folders;
}
