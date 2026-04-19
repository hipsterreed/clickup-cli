import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useState, useEffect } from 'react';
import gradient from 'gradient-string';
const LOGO = [
    ' ██████╗██╗     ██╗ ██████╗██╗  ██╗██╗   ██╗██████╗ ',
    '██╔════╝██║     ██║██╔════╝██║ ██╔╝██║   ██║██╔══██╗',
    '██║     ██║     ██║██║     █████╔╝ ██║   ██║██████╔╝',
    '██║     ██║     ██║██║     ██╔═██╗ ██║   ██║██╔═══╝ ',
    '╚██████╗███████╗██║╚██████╗██║  ██╗╚██████╔╝██║     ',
    ' ╚═════╝╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝     ',
];
const clickupGradient = gradient(['#7B68EE', '#00BCD4']);
export default function Header({ subtitle, animate = true }) {
    const [revealed, setRevealed] = useState(animate ? 0 : LOGO[0].length);
    useEffect(() => {
        if (!animate)
            return;
        if (revealed >= LOGO[0].length)
            return;
        const timer = setTimeout(() => {
            setRevealed((r) => Math.min(r + 3, LOGO[0].length));
        }, 12);
        return () => clearTimeout(timer);
    }, [revealed, animate]);
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [LOGO.map((line, i) => (_jsx(Text, { children: clickupGradient(line.slice(0, revealed)) }, i))), subtitle && (_jsxs(Text, { color: "gray", children: ['  ', subtitle] }))] }));
}
