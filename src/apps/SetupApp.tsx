import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import Header from '../ui/Header.js';
import Spinner from '../ui/Spinner.js';
import { getUser } from '../api/auth.js';
import { getTeams } from '../api/teams.js';
import { setConfig } from '../config/config.js';
import type { ClickUpUser, ClickUpTeam } from '../types/clickup.js';

type Step = 'token' | 'validating' | 'workspace' | 'saving' | 'done' | 'error';

interface Props {
  prefillToken?: string;
  prefillTeamId?: string;
}

export default function SetupApp({ prefillToken, prefillTeamId }: Props) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>(prefillToken && prefillTeamId ? 'validating' : 'token');
  const [token, setToken] = useState(prefillToken ?? '');
  const [tokenInput, setTokenInput] = useState(prefillToken ?? '');
  const [user, setUser] = useState<ClickUpUser | null>(null);
  const [teams, setTeams] = useState<ClickUpTeam[]>([]);
  const [workspaceIdx, setWorkspaceIdx] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle keyboard for workspace selection and done/error screens
  useInput(async (input, key) => {
    if (step === 'done' && (key.return || input === 'q')) {
      exit();
      return;
    }
    if (step === 'error' && (key.return || input === 'q')) {
      setStep('token');
      setError('');
      return;
    }
    if (step === 'workspace') {
      if (key.upArrow) {
        setWorkspaceIdx((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setWorkspaceIdx((i) => Math.min(teams.length - 1, i + 1));
      } else if (key.return) {
        const selected = teams[workspaceIdx];
        if (selected) {
          setStep('saving');
          try {
            await saveConfig(token, selected.id, user!, teams);
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
          }
        }
      }
    }
  });

  // Auto-run validation if both prefills provided
  useState(() => {
    if (prefillToken && prefillTeamId) {
      handleTokenSubmit(prefillToken).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStep('error');
      });
    }
  });

  async function handleTokenSubmit(val: string) {
    const t = val.trim();
    if (!t) return;
    setToken(t);
    setStep('validating');
    try {
      const u = await getUser(t);
      setUser(u);
      const ts = await getTeams(t);
      setTeams(ts);

      if (prefillTeamId) {
        await saveConfig(t, prefillTeamId, u, ts);
      } else if (ts.length === 1) {
        // Only one workspace — auto-select
        await saveConfig(t, ts[0].id, u, ts);
      } else {
        setStep('workspace');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  }

  async function saveConfig(
    tok: string,
    teamId: string,
    u: ClickUpUser,
    ts: ClickUpTeam[],
  ) {
    const team = ts.find((t) => t.id === teamId);
    setConfig({
      apiToken: tok,
      teamId,
      userId: u.id,
      username: u.username,
      email: u.email,
    });
    setSuccessMsg(
      `${u.username} (${u.email}) · Workspace: ${team?.name ?? teamId}`,
    );
    setStep('done');
  }

  return (
    <Box flexDirection="column">
      <Header subtitle="Setup — Connect your ClickUp account" animate />

      {step === 'token' && (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Box>
            <Text color="gray">Get your Personal API token at </Text>
            <Text color="cyan">app.clickup.com/settings/apps</Text>
          </Box>
          <Box>
            <Text color="cyan" bold>Token: </Text>
            <TextInput
              value={tokenInput}
              onChange={setTokenInput}
              onSubmit={handleTokenSubmit}
              mask="*"
              placeholder="pk_..."
            />
          </Box>
          <Text color="gray" dimColor>Press Enter to continue</Text>
        </Box>
      )}

      {step === 'validating' && (
        <Box paddingX={1}>
          <Spinner message="Verifying token and loading workspaces..." />
        </Box>
      )}

      {step === 'workspace' && (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Box>
            <Text color="green">✓ </Text>
            <Text>Authenticated as </Text>
            <Text bold>{user?.username}</Text>
            <Text color="gray"> ({user?.email})</Text>
          </Box>
          <Box marginTop={1}>
            <Text bold>Select workspace:</Text>
          </Box>
          <Box flexDirection="column">
            {teams.map((t, i) => (
              <Box key={t.id}>
                <Text color={i === workspaceIdx ? 'cyan' : 'gray'} bold={i === workspaceIdx}>
                  {i === workspaceIdx ? '▶ ' : '  '}
                </Text>
                <Text color={i === workspaceIdx ? 'white' : 'gray'} bold={i === workspaceIdx}>
                  {t.name}
                </Text>
                <Text color="gray" dimColor>  ({t.id})</Text>
              </Box>
            ))}
          </Box>
          <Text color="gray" dimColor>↑↓ navigate  ·  enter select</Text>
        </Box>
      )}

      {step === 'saving' && (
        <Box paddingX={1}>
          <Spinner message="Saving configuration..." />
        </Box>
      )}

      {step === 'done' && (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Box
            borderStyle="round"
            borderColor="green"
            paddingX={2}
            paddingY={1}
            flexDirection="column"
          >
            <Text color="green" bold>✓ Setup complete!</Text>
            <Text color="gray">{successMsg}</Text>
          </Box>
          <Text color="gray" dimColor>
            Run <Text color="cyan">clickup tasks</Text> to get started.
            Press Enter or q to exit.
          </Text>
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column" gap={1} paddingX={1}>
          <Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
            <Text color="red">✗ {error}</Text>
          </Box>
          <Text color="gray" dimColor>Press Enter to try again.</Text>
        </Box>
      )}
    </Box>
  );
}
