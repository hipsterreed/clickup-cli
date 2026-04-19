import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from './Spinner.js';
import { getSpaces } from '../api/spaces.js';
import { getFolders } from '../api/folders.js';
import { getListsInSpace, getListsInFolder } from '../api/lists.js';
import { getConfig, getRecentLists, pushRecentList } from '../config/config.js';
export default function BrowseScreen({ onSelect, onQuit }) {
    const { teamId } = getConfig();
    const [items, setItems] = useState([
        { type: 'scope', label: 'My Tasks', filters: { me: true } },
        { type: 'scope', label: 'All Team Tasks', filters: {} },
    ]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [idx, setIdx] = useState(0);
    const recents = getRecentLists();
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
                    allLists.sort((a, b) => (a.list.orderindex ?? 0) - (b.list.orderindex ?? 0));
                    const listItems = allLists.map(({ list, spaceName }) => ({
                        type: 'list',
                        label: list.name,
                        sublabel: spaceName,
                        filters: { listId: list.id },
                    }));
                    const recentItems = getRecentLists().map((r) => ({
                        type: 'list',
                        label: r.name,
                        sublabel: 'recent',
                        filters: { listId: r.id },
                    }));
                    setItems([
                        { type: 'scope', label: 'My Tasks', filters: { me: true } },
                        { type: 'scope', label: 'All Team Tasks', filters: {} },
                        ...(recentItems.length > 0
                            ? [{ type: 'separator', label: 'recent' }, ...recentItems]
                            : []),
                        ...(listItems.length > 0
                            ? [{ type: 'separator', label: 'lists' }, ...listItems]
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
    const q = query.toLowerCase();
    const filtered = q
        ? items.filter((item) => {
            if (item.type === 'separator')
                return false;
            return item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q);
        })
        : items;
    const selectableFiltered = filtered.filter((i) => i.type !== 'separator');
    const visibleIdx = Math.min(idx, selectableFiltered.length - 1);
    useInput((input, key) => {
        if (key.escape) {
            onQuit();
            return;
        }
        if (key.upArrow) {
            setIdx((i) => Math.max(0, i - 1));
        }
        else if (key.downArrow) {
            setIdx((i) => Math.min(selectableFiltered.length - 1, i + 1));
        }
        else if (key.return) {
            const item = selectableFiltered[visibleIdx];
            if (item?.filters) {
                if (item.type === 'list' && item.filters.listId) {
                    pushRecentList({ id: item.filters.listId, name: item.label });
                }
                onSelect(item.filters, item.label);
            }
        }
        else if (key.backspace || key.delete) {
            setQuery((q) => q.slice(0, -1));
            setIdx(0);
        }
        else if (input && !key.ctrl && !key.meta) {
            setQuery((q) => q + input);
            setIdx(0);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 0, marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "ClickUp CLI" }), _jsx(Text, { color: "gray", children: "  \u00B7  " }), query
                        ? _jsx(Text, { color: "white", children: query })
                        : _jsx(Text, { color: "gray", children: "type to filter lists  \u00B7  esc quit" })] }), _jsxs(Box, { flexDirection: "column", paddingX: 1, children: [(() => {
                        let selectableI = -1;
                        return filtered.map((item, i) => {
                            if (item.type === 'separator') {
                                return (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "gray", children: ['  ── ', item.label, ' ──'] }) }, `sep-${i}`));
                            }
                            selectableI++;
                            const isSelected = selectableI === visibleIdx;
                            return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', bold: isSelected, children: isSelected ? '▶ ' : '  ' }), _jsx(Text, { color: isSelected ? 'white' : 'gray', bold: isSelected, children: item.label }), item.sublabel && item.sublabel !== 'recent' && (_jsxs(Text, { color: "gray", children: ['  ', item.sublabel] }))] }, `${item.type}-${item.label}-${i}`));
                        });
                    })(), loading && (_jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Spinner, { message: "Loading lists..." }) })), !loading && filtered.length === 0 && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { color: "gray", children: "No matches" }) }))] }), _jsx(Box, { marginTop: 1, paddingX: 1, children: _jsx(Text, { color: "gray", children: "\u2191\u2193 navigate  \u00B7  enter select  \u00B7  backspace clear  \u00B7  esc quit" }) })] }));
}
