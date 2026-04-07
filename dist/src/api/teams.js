import { createClientWithToken, createClient } from './client.js';
export async function getTeams(token) {
    const client = createClientWithToken(token);
    const res = await client.get('/team');
    return res.data.teams;
}
export async function getTeam(teamId) {
    const client = createClient();
    const res = await client.get(`/team/${teamId}`);
    return res.data.team;
}
