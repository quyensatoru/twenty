import { readInitials } from '../utils/read-initials.util';
import {
  INBOX_CIRCLE_STYLE,
  INBOX_TOKENS,
  readToneForName,
} from './inbox-tokens';

type InboxAvatarProps = {
  name: string;
  size?: number;
  // A ring in the product's colour tells at a glance which inbox the chat
  // came from.
  ringColor?: string;
  isOnline?: boolean;
};

export const InboxAvatar = ({
  name,
  size = 36,
  ringColor,
  isOnline = false,
}: InboxAvatarProps) => {
  const tone = readToneForName(name);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexShrink: 0,
        width: size,
        height: size,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...INBOX_CIRCLE_STYLE,
          alignItems: 'center',
          background: tone.background,
          boxShadow:
            ringColor === undefined
              ? 'none'
              : `0 0 0 2px ${INBOX_TOKENS.background}, 0 0 0 3.5px ${ringColor}`,
          color: tone.text,
          display: 'inline-flex',
          fontSize: Math.round(size * 0.36),
          fontWeight: 600,
          height: size,
          justifyContent: 'center',
          letterSpacing: '0.02em',
          width: size,
        }}
      >
        {readInitials(name)}
      </span>
      {isOnline && (
        <span
          style={{
            ...INBOX_CIRCLE_STYLE,
            background: INBOX_TOKENS.success,
            border: `2px solid ${INBOX_TOKENS.background}`,
            bottom: -1,
            height: Math.max(8, Math.round(size * 0.28)),
            position: 'absolute',
            right: -1,
            width: Math.max(8, Math.round(size * 0.28)),
          }}
        />
      )}
    </span>
  );
};
