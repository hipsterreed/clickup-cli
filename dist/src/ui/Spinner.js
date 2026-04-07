import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useState, useEffect } from 'react';
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export default function Spinner({ message }) {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            setFrame((f) => (f + 1) % FRAMES.length);
        }, 80);
        return () => clearInterval(timer);
    }, []);
    return (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: FRAMES[frame] }), _jsxs(Text, { children: [" ", message] })] }));
}
