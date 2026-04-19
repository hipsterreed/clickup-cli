import Conf from 'conf';
import type { ClickUpConfig, RecentList } from '../types/clickup.js';

const store = new Conf<ClickUpConfig>({
  projectName: 'clickup-cli',
  schema: {
    apiToken: { type: 'string' },
    teamId: { type: 'string' },
    userId: { type: 'number' },
    username: { type: 'string' },
    email: { type: 'string' },
  },
});

export function getConfig(): ClickUpConfig {
  return store.store as ClickUpConfig;
}

export function setConfig(data: Partial<ClickUpConfig>): void {
  for (const [key, value] of Object.entries(data)) {
    store.set(key as keyof ClickUpConfig, value as never);
  }
}

export function isConfigured(): boolean {
  return store.has('apiToken') && store.has('teamId');
}

export function clearConfig(): void {
  store.clear();
}

export function getConfigPath(): string {
  return store.path;
}

export function pushRecentList(list: RecentList): void {
  const prev = (store.get('recentLists') as RecentList[] | undefined) ?? [];
  const next = [list, ...prev.filter((l) => l.id !== list.id)].slice(0, 2);
  store.set('recentLists', next);
}

export function getRecentLists(): RecentList[] {
  return (store.get('recentLists') as RecentList[] | undefined) ?? [];
}
