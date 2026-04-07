import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import Header from '../ui/Header.js';
import Spinner from '../ui/Spinner.js';
import { getUser } from '../api/auth.js';
import { getTeams } from '../api/teams.js';
import { setConfig } from '../config/config.js';
export default function SetupApp({ prefillToken, prefillTeamId }) {
    const { exit } = useApp();
    const [step, setStep] = useState(prefillToken && prefillTeamId ? 'validating' : 'token');
    const [token, setToken] = useState(prefillToken ?? '');
    const [tokenInput, setTokenInput] = useState(prefillToken ?? '');
    const [user, setUser] = useState(null);
    const [teams, setTeams] = useState([]);
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
            }
            else if (key.downArrow) {
                setWorkspaceIdx((i) => Math.min(teams.length - 1, i + 1));
            }
            else if (key.return) {
                const selected = teams[workspaceIdx];
                if (selected) {
                    setStep('saving');
                    try {
                        await saveConfig(token, selected.id, user, teams);
                    }
                    catch (err) {
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
            handleTokenSubmit(prefillToken).catch((err) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setStep('error');
            });
        }
    });
    async function handleTokenSubmit(val) {
        const t = val.trim();
        if (!t)
            return;
        setToken(t);
        setStep('validating');
        try {
            const u = await getUser(t);
            setUser(u);
            const ts = await getTeams(t);
            setTeams(ts);
            if (prefillTeamId) {
                await saveConfig(t, prefillTeamId, u, ts);
            }
            else if (ts.length === 1) {
                // Only one workspace — auto-select
                await saveConfig(t, ts[0].id, u, ts);
            }
            else {
                setStep('workspace');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStep('error');
        }
    }
    async function saveConfig(tok, teamId, u, ts) {
        const team = ts.find((t) => t.id === teamId);
        setConfig({
            apiToken: tok,
            teamId,
            userId: u.id,
            username: u.username,
            email: u.email,
        });
        setSuccessMsg(`${u.username} (${u.email}) · Workspace: ${team?.name ?? teamId}`);
        setStep('done');
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Header, { subtitle: "Setup \u2014 Connect your ClickUp account", animate: true }), step === 'token' && (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "Get your Personal API token at " }), _jsx(Text, { color: "cyan", children: "app.clickup.com/settings/apps" })] }), _jsxs(Box, { children: [_jsx(Text, { color: "cyan", bold: true, children: "Token: " }), _jsx(TextInput, { value: tokenInput, onChange: setTokenInput, onSubmit: handleTokenSubmit, mask: "*", placeholder: "pk_..." })] }), _jsx(Text, { color: "gray", dimColor: true, children: "Press Enter to continue" })] })), step === 'validating' && (_jsx(Box, { paddingX: 1, children: _jsx(Spinner, { message: "Verifying token and loading workspaces..." }) })), step === 'workspace' && (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "green", children: "\u2713 " }), _jsx(Text, { children: "Authenticated as " }), _jsx(Text, { bold: true, children: user?.username }), _jsxs(Text, { color: "gray", children: [" (", user?.email, ")"] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { bold: true, children: "Select workspace:" }) }), _jsx(Box, { flexDirection: "column", children: teams.map((t, i) => (_jsxs(Box, { children: [_jsx(Text, { color: i === workspaceIdx ? 'cyan' : 'gray', bold: i === workspaceIdx, children: i === workspaceIdx ? '▶ ' : '  ' }), _jsx(Text, { color: i === workspaceIdx ? 'white' : 'gray', bold: i === workspaceIdx, children: t.name }), _jsxs(Text, { color: "gray", dimColor: true, children: ["  (", t.id, ")"] })] }, t.id))) }), _jsx(Text, { color: "gray", dimColor: true, children: "\u2191\u2193 navigate  \u00B7  enter select" })] })), step === 'saving' && (_jsx(Box, { paddingX: 1, children: _jsx(Spinner, { message: "Saving configuration..." }) })), step === 'done' && (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 1, children: [_jsxs(Box, { borderStyle: "round", borderColor: "green", paddingX: 2, paddingY: 1, flexDirection: "column", children: [_jsx(Text, { color: "green", bold: true, children: "\u2713 Setup complete!" }), _jsx(Text, { color: "gray", children: successMsg })] }), _jsxs(Text, { color: "gray", dimColor: true, children: ["Run ", _jsx(Text, { color: "cyan", children: "clickup tasks" }), " to get started. Press Enter or q to exit."] })] })), step === 'error' && (_jsxs(Box, { flexDirection: "column", gap: 1, paddingX: 1, children: [_jsx(Box, { borderStyle: "round", borderColor: "red", paddingX: 2, paddingY: 1, children: _jsxs(Text, { color: "red", children: ["\u2717 ", error] }) }), _jsx(Text, { color: "gray", dimColor: true, children: "Press Enter to try again." })] }))] }));
}
