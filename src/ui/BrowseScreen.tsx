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

  // Selectable items only (skip separators)
  const selectableItems = items.filter((i) => i.type !== 'separator');
  const selectableIdx = Math.min(idx, selectableItems.length - 1);

  useInput((input, key) => {
    if (input === 'q') { onQuit(); return; }

    if (key.upArrow) {
      setIdx((i) => {
        let next = i - 1;
        while (next >= 0 && items[next]?.type === 'separator') next--;
        return Math.max(0, next);
      });
    } else if (key.downArrow) {
      setIdx((i) => {
        let next = i + 1;
        while (next < items.length && items[next]?.type === 'separator') next++;
        return Math.min(items.length - 1, next);
      });
    } else if (key.return) {
      const item = items[idx];
      if (item && item.type !== 'separator' && item.filters) {
        onSelect(item.filters, item.label);
      }
    }
  });

  return (
    <Box flexDirection="column">
      {/* Title */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={0}
        marginBottom={1}
      >
        <Text bold color="cyan">ClickUp CLI</Text>
        <Text color="gray">  ·  Browse Tasks</Text>
      </Box>

      {/* List */}
      <Box flexDirection="column" paddingX={1}>
        {items.map((item, i) => {
          if (item.type === 'separator') {
            return (
              <Box key={`sep-${i}`} marginY={1}>
                <Text color="gray" dimColor>{'  ────── Lists ──────'}</Text>
              </Box>
            );
          }

          const isSelected = i === idx;
          return (
            <Box key={`${item.type}-${item.label}-${i}`}>
              <Text color={isSelected ? 'cyan' : 'gray'} bold={isSelected}>
                {isSelected ? '▶ ' : '  '}
              </Text>
              <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
                {item.label}
              </Text>
              {item.sublabel && (
                <Text color="gray" dimColor>
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
      </Box>

      {/* Footer */}
      <Box marginTop={1} paddingX={1}>
        <Text color="gray" dimColor>↑↓ navigate  ·  enter select  ·  q quit</Text>
      </Box>
    </Box>
  );
}
