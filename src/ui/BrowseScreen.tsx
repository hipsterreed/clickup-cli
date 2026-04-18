import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from './Spinner.js';
import type { ClickUpList, TaskFilters } from '../types/clickup.js';
import { getSpaces } from '../api/spaces.js';
import { getFolders } from '../api/folders.js';
import { getListsInSpace, getListsInFolder } from '../api/lists.js';
import { getConfig } from '../config/config.js';

interface BrowseItem {
  type: 'scope' | 'list' | 'separator';
  label: string;
  sublabel?: string;
  filters?: TaskFilters;
}

interface Props {
  onSelect: (filters: TaskFilters, label: string) => void;
  onQuit: () => void;
}

export default function BrowseScreen({ onSelect, onQuit }: Props) {
  const { teamId } = getConfig();
  const [items, setItems] = useState<BrowseItem[]>([
    { type: 'scope', label: 'My Tasks', filters: { me: true } },
    { type: 'scope', label: 'All Team Tasks', filters: {} },
  ]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const spaces = await getSpaces(teamId);
        const allLists: Array<{ list: ClickUpList; spaceName: string }> = [];

        for (const space of spaces) {
          try {
            const spaceLists = await getListsInSpace(space.id);
            for (const l of spaceLists) allLists.push({ list: l, spaceName: space.name });
            const folders = await getFolders(space.id);
            for (const folder of folders) {
              const folderLists = await getListsInFolder(folder.id);
              for (const l of folderLists) allLists.push({ list: l, spaceName: space.name });
            }
          } catch {
            // skip spaces we can't read
          }
        }

        if (!cancelled) {
          allLists.sort((a, b) => (a.list.orderindex ?? 0) - (b.list.orderindex ?? 0));
          const listItems: BrowseItem[] = allLists.map(({ list, spaceName }) => ({
            type: 'list' as const,
            label: list.name,
            sublabel: spaceName,
            filters: { listId: list.id },
          }));
          setItems([
            { type: 'scope', label: 'My Tasks', filters: { me: true } },
            { type: 'scope', label: 'All Team Tasks', filters: {} },
            ...(listItems.length > 0
              ? [{ type: 'separator' as const, label: '' }, ...listItems]
              : []),
          ]);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  const q = query.toLowerCase();
  const filtered = items.filter((item) => {
    if (item.type === 'separator') return false;
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q);
  });

  const visibleIdx = Math.min(idx, filtered.length - 1);

  useInput((input, key) => {
    if (key.escape) { onQuit(); return; }

    if (key.upArrow) {
      setIdx((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (key.return) {
      const item = filtered[visibleIdx];
      if (item?.filters) onSelect(item.filters, item.label);
    } else if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setIdx(0);
    } else if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setIdx(0);
    }
  });

  return (
    <Box flexDirection="column">
      {/* Title / search bar */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={0} marginBottom={1}>
        <Text bold color="cyan">ClickUp CLI</Text>
        <Text color="gray">  ·  </Text>
        {query
          ? <Text color="white">{query}</Text>
          : <Text color="gray">type to filter lists  ·  esc quit</Text>
        }
      </Box>

      {/* List */}
      <Box flexDirection="column" paddingX={1}>
        {filtered.map((item, i) => {
          const isSelected = i === visibleIdx;
          return (
            <Box key={`${item.type}-${item.label}-${i}`}>
              <Text color={isSelected ? 'cyan' : 'gray'} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}
              </Text>
              <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
                {item.label}
              </Text>
              {item.sublabel && (
                <Text color="gray">
                  {'  '}{item.sublabel}
                </Text>
              )}
            </Box>
          );
        })}

        {loading && (
          <Box marginTop={1} paddingLeft={2}>
            <Spinner message="Loading lists..." />
          </Box>
        )}

        {!loading && filtered.length === 0 && (
          <Box paddingLeft={2}>
            <Text color="gray">No matches</Text>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} paddingX={1}>
        <Text color="gray">↑↓ navigate  ·  enter select  ·  backspace clear  ·  esc quit</Text>
      </Box>
    </Box>
  );
}
