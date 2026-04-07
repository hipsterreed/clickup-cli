import type { ClickUpList } from '../types/clickup.js';
import { createClient } from './client.js';

export async function getListsInSpace(spaceId: string): Promise<ClickUpList[]> {
  const client = createClient();
  const res = await client.get<{ lists: ClickUpList[] }>(
    `/space/${spaceId}/list`,
    { params: { archived: false } },
  );
  return res.data.lists;
}

export async function getListsInFolder(folderId: string): Promise<ClickUpList[]> {
  const client = createClient();
  const res = await client.get<{ lists: ClickUpList[] }>(
    `/folder/${folderId}/list`,
    { params: { archived: false } },
  );
  return res.data.lists;
}

export async function getList(listId: string): Promise<ClickUpList> {
  const client = createClient();
  const res = await client.get<ClickUpList>(`/list/${listId}`);
  return res.data;
}
