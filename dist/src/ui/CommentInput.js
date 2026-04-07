import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
export default function CommentInput({ onSubmit, onCancel }) {
    const [value, setValue] = useState('');
    const [confirming, setConfirming] = useState(false);
    useInput((input, key) => {
        if (key.escape) {
            if (confirming) {
                setConfirming(false);
            }
            else {
                onCancel();
            }
            return;
        }
        if (confirming) {
            if (input === 'p') {
                if (value.trim())
                    onSubmit(value.trim());
            }
            else if (input === 'e') {
                setConfirming(false);
            }
        }
    });
    const handleSubmit = (val) => {
        if (val.trim()) {
            setConfirming(true);
        }
    };
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, width: 60, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "Add Comment" }) }), !confirming ? (_jsxs(_Fragment, { children: [_jsx(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, marginBottom: 1, children: _jsx(TextInput, { value: value, onChange: setValue, onSubmit: handleSubmit, placeholder: "Type your comment and press Enter..." }) }), _jsx(Text, { color: "gray", dimColor: true, children: "enter to preview  \u00B7  esc cancel" })] })) : (_jsxs(_Fragment, { children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: "gray", children: "Preview:" }), _jsx(Text, { wrap: "wrap", children: value })] }), _jsxs(Box, { children: [_jsx(Text, { color: "green", bold: true, children: "[p] Post  " }), _jsx(Text, { color: "gray", children: "[e] Edit  " }), _jsx(Text, { color: "red", children: "[esc] Cancel" })] })] }))] }));
}
