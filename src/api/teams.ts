import type { ClickUpTeam } from '../types/clickup.js';
import { createClientWithToken, createClient } from './client.js';

export async function getTeams(token: string): Promise<ClickUpTeam[]> {
  const client = createClientWithToken(token);
  const res = await client.get<{ teams: ClickUpTeam[] }>('/team');
  return res.data.teams;
}

export async function getTeam(teamId: string): Promise<ClickUpTeam> {
  const client = createClient();
  const res = await client.get<{ team: ClickUpTeam }>(`/team/${teamId}`);
  return res.data.team;
}
