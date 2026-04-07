import { createClient } from './client.js';
export async function getSpaces(teamId) {
    const client = createClient();
    const res = await client.get(`/team/${teamId}/space`, { params: { archived: false } });
    return res.data.spaces;
}
