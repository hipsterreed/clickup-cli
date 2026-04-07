import { createClientWithToken } from './client.js';
export async function getUser(token) {
    const client = createClientWithToken(token);
    const res = await client.get('/user');
    return res.data.user;
}
