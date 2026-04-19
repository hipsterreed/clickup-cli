import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { formatCommentDate } from '../utils/format.js';
import { getConfig } from '../config/config.js';
export default function CommentThread({ comments, maxHeight }) {
    const { userId } = getConfig();
    const visible = maxHeight ? comments.slice(-maxHeight) : comments;
    if (comments.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Comments" }), _jsx(Text, { color: "gray", children: "  No comments yet." })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: true, children: ["Comments (", comments.length, ")"] }), _jsx(Text, { color: "gray", children: '─'.repeat(50) }), visible.map((c) => {
                const isMe = c.user.id === userId;
                const author = isMe ? 'You' : c.user.username;
                const date = formatCommentDate(c.date);
                const text = c.comment_text || c.comment?.map((p) => p.text).join('') || '';
                return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Box, { children: _jsxs(Text, { color: isMe ? 'cyan' : 'white', bold: isMe, children: ["[", author, " \u2014 ", date, "]"] }) }), _jsxs(Text, { color: "white", wrap: "wrap", children: ['  ', text] })] }, c.id));
            })] }));
}
