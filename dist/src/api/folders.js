import { createClient } from './client.js';
export async function getFolders(spaceId) {
    const client = createClient();
    const res = await client.get(`/space/${spaceId}/folder`, { params: { archived: false } });
    return res.data.folders;
}
