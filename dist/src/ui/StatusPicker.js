import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { statusColorInk } from './colors.js';
export default function StatusPicker({ statuses, currentStatus, onConfirm, onCancel, }) {
    const [selectedIdx, setSelectedIdx] = useState(() => {
        const idx = statuses.findIndex((s) => s.status.toLowerCase() === currentStatus.toLowerCase());
        return idx >= 0 ? idx : 0;
    });
    const [flash, setFlash] = useState(false);
    useInput((_, key) => {
        if (key.upArrow) {
            setSelectedIdx((i) => Math.max(0, i - 1));
        }
        else if (key.downArrow) {
            setSelectedIdx((i) => Math.min(statuses.length - 1, i + 1));
        }
        else if (key.return) {
            setFlash(true);
        }
        else if (key.escape) {
            onCancel();
        }
    });
    useEffect(() => {
        if (!flash)
            return;
        const timer = setTimeout(() => {
            onConfirm(statuses[selectedIdx].status);
        }, 200);
        return () => clearTimeout(timer);
    }, [flash]);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "Change Status" }) }), statuses.map((s, i) => {
                const isSelected = i === selectedIdx;
                const isCurrent = s.status.toLowerCase() === currentStatus.toLowerCase();
                const color = statusColorInk(s.status);
                return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', children: isSelected ? '▶ ' : '  ' }), _jsxs(Text, { color: flash && isSelected ? 'white' : color, bold: isSelected, inverse: flash && isSelected, children: ["\u25CF ", s.status] }), isCurrent && (_jsx(Text, { color: "gray", dimColor: true, children: "  \u2190 current" }))] }, s.status));
            }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", dimColor: true, children: "enter confirm  \u00B7  esc cancel" }) })] }));
}
