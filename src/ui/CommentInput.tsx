import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';

interface Props {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export default function CommentInput({ onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('');
  const [confirming, setConfirming] = useState(false);

  useInput((input, key) => {
    if (key.escape) {
      if (confirming) {
        setConfirming(false);
      } else {
        onCancel();
      }
      return;
    }

    if (confirming) {
      if (input === 'p') {
        if (value.trim()) onSubmit(value.trim());
      } else if (input === 'e') {
        setConfirming(false);
      }
    }
  });

  const handleSubmit = (val: string) => {
    if (val.trim()) {
      setConfirming(true);
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">Add Comment</Text>
      </Box>

      {!confirming ? (
        <>
          <Box borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
            <TextInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              placeholder="Type your comment and press Enter..."
            />
          </Box>
          <Text color="gray">enter to preview  ·  esc cancel</Text>
        </>
      ) : (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Text color="gray">Preview:</Text>
            <Text wrap="wrap">{value}</Text>
          </Box>
          <Box>
            <Text color="green" bold>[p] Post  </Text>
            <Text color="gray">[e] Edit  </Text>
            <Text color="red">[esc] Cancel</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
