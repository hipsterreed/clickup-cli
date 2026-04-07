import { createClient } from './client.js';
export async function getListsInSpace(spaceId) {
    const client = createClient();
    const res = await client.get(`/space/${spaceId}/list`, { params: { archived: false } });
    return res.data.lists;
}
export async function getListsInFolder(folderId) {
    const client = createClient();
    const res = await client.get(`/folder/${folderId}/list`, { params: { archived: false } });
    return res.data.lists;
}
export async function getList(listId) {
    const client = createClient();
    const res = await client.get(`/list/${listId}`);
    return res.data;
}
