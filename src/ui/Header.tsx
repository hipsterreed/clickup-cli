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

interface Props {
  subtitle?: string;
  animate?: boolean;
}

export default function Header({ subtitle, animate = true }: Props) {
  const [revealed, setRevealed] = useState(animate ? 0 : LOGO[0].length);

  useEffect(() => {
    if (!animate) return;
    if (revealed >= LOGO[0].length) return;
    const timer = setTimeout(() => {
      setRevealed((r) => Math.min(r + 3, LOGO[0].length));
    }, 12);
    return () => clearTimeout(timer);
  }, [revealed, animate]);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {LOGO.map((line, i) => (
        <Text key={i}>{clickupGradient(line.slice(0, revealed))}</Text>
      ))}
      {subtitle && (
        <Text color="gray" dimColor>
          {'  '}{subtitle}
        </Text>
      )}
    </Box>
  );
}
