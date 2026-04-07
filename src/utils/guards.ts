import chalk from 'chalk';
import { isConfigured } from '../config/config.js';

export function requireConfig(): void {
  if (!isConfigured()) {
    console.error(
      chalk.yellow('No configuration found.') +
        ' Run ' +
        chalk.cyan('clickup setup') +
        ' first.',
    );
    process.exit(1);
  }
}
