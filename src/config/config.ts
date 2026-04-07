import Conf from 'conf';
import type { ClickUpConfig } from '../types/clickup.js';

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
