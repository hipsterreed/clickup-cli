import { Box, Text } from 'ink';
import { useState, useEffect } from 'react';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface Props {
  message: string;
}

export default function Spinner({ message }: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <Text color="cyan">{FRAMES[frame]}</Text>
      <Text> {message}</Text>
    </Box>
  );
}
