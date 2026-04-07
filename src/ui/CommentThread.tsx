import { Box, Text } from 'ink';
import type { ClickUpComment } from '../types/clickup.js';
import { formatCommentDate } from '../utils/format.js';
import { getConfig } from '../config/config.js';

interface Props {
  comments: ClickUpComment[];
  maxHeight?: number;
}

export default function CommentThread({ comments, maxHeight }: Props) {
  const { userId } = getConfig();
  const visible = maxHeight ? comments.slice(-maxHeight) : comments;

  if (comments.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold>Comments</Text>
        <Text color="gray" dimColor>  No comments yet.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Comments ({comments.length})</Text>
      <Text color="gray">{'─'.repeat(50)}</Text>
      {visible.map((c) => {
        const isMe = c.user.id === userId;
        const author = isMe ? 'You' : c.user.username;
        const date = formatCommentDate(c.date);
        const text = c.comment_text || c.comment?.map((p) => p.text).join('') || '';
        return (
          <Box key={c.id} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={isMe ? 'cyan' : 'white'} bold={isMe}>
                [{author} — {date}]
              </Text>
            </Box>
            <Text color="white" wrap="wrap">
              {'  '}{text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
