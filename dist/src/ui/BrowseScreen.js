import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from './Spinner.js';
import { getSpaces } from '../api/spaces.js';
import { getFolders } from '../api/folders.js';
import { getListsInSpace, getListsInFolder } from '../api/lists.js';
import { getConfig } from '../config/config.js';
export default function BrowseScreen({ onSelect, onQuit }) {
    const { teamId } = getConfig();
    const [items, setItems] = useState([
        { type: 'scope', label: 'My Tasks', filters: { me: true } },
        { type: 'scope', label: 'All Team Tasks', filters: {} },
    ]);
    const [loading, setLoading] = useState(true);
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const spaces = await getSpaces(teamId);
                const allLists = [];
                for (const space of spaces) {
                    try {
                        const spaceLists = await getListsInSpace(space.id);
                        for (const l of spaceLists)
                            allLists.push({ list: l, spaceName: space.name });
                        const folders = await getFolders(space.id);
                        for (const folder of folders) {
                            const folderLists = await getListsInFolder(folder.id);
                            for (const l of folderLists)
                                allLists.push({ list: l, spaceName: space.name });
                        }
                    }
                    catch {
                        // skip spaces we can't read
                    }
                }
                if (!cancelled) {
                    const listItems = allLists.map(({ list, spaceName }) => ({
                        type: 'list',
                        label: list.name,
                        sublabel: spaceName,
                        filters: { listId: list.id },
                    }));
                    setItems([
                        { type: 'scope', label: 'My Tasks', filters: { me: true } },
                        { type: 'scope', label: 'All Team Tasks', filters: {} },
                        ...(listItems.length > 0
                            ? [{ type: 'separator', label: '' }, ...listItems]
                            : []),
                    ]);
                    setLoading(false);
                }
            }
            catch {
                if (!cancelled)
                    setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [teamId]);
    // Selectable items only (skip separators)
    const selectableItems = items.filter((i) => i.type !== 'separator');
    const selectableIdx = Math.min(idx, selectableItems.length - 1);
    useInput((input, key) => {
        if (input === 'q') {
            onQuit();
            return;
        }
        if (key.upArrow) {
            setIdx((i) => {
                let next = i - 1;
                while (next >= 0 && items[next]?.type === 'separator')
                    next--;
                return Math.max(0, next);
            });
        }
        else if (key.downArrow) {
            setIdx((i) => {
                let next = i + 1;
                while (next < items.length && items[next]?.type === 'separator')
                    next++;
                return Math.min(items.length - 1, next);
            });
        }
        else if (key.return) {
            const item = items[idx];
            if (item && item.type !== 'separator' && item.filters) {
                onSelect(item.filters, item.label);
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 0, marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "ClickUp CLI" }), _jsx(Text, { color: "gray", children: "  \u00B7  Browse Tasks" })] }), _jsxs(Box, { flexDirection: "column", paddingX: 1, children: [items.map((item, i) => {
                        if (item.type === 'separator') {
                            return (_jsx(Box, { marginY: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: '  ────── Lists ──────' }) }, `sep-${i}`));
                        }
                        const isSelected = i === idx;
                        return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', bold: isSelected, children: isSelected ? '▶ ' : '  ' }), _jsx(Text, { color: isSelected ? 'white' : 'gray', bold: isSelected, children: item.label }), item.sublabel && (_jsxs(Text, { color: "gray", dimColor: true, children: ['  ', item.sublabel] }))] }, `${item.type}-${item.label}-${i}`));
                    }), loading && (_jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Spinner, { message: "Loading lists..." }) }))] }), _jsx(Box, { marginTop: 1, paddingX: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: "\u2191\u2193 navigate  \u00B7  enter select  \u00B7  q quit" }) })] }));
}
