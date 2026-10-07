import { useState } from 'react';

import {
  stringToThemeColorName,
  type ThemeColorName,
} from '../../utils/string-to-theme-color.util';
import { readAvatarImageUrl } from '../utils/read-avatar-image-url.util';
import { TASK_CIRCLE_STYLE, TASK_TOKENS } from './task-tokens';

type TaskAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  // Twenty draws people as circles and records as rounded squares.
  shape?: 'circle' | 'square';
  // Overrides the hash for anything whose colour is a stored choice rather
  // than a function of its name — an issue status, say.
  colorName?: ThemeColorName;
};

// twenty-ui's Avatar is base-ui backed, and base-ui's event handling throws in
// the sandbox, so the look is reproduced instead: the shape Twenty uses, the
// first letter of the name, and the palette entry its own hash of the name
// picks.
export const TaskAvatar = ({
  name,
  avatarUrl,
  size = 24,
  shape = 'circle',
  colorName,
}: TaskAvatarProps) => {
  const [hasImageFailed, setHasImageFailed] = useState(false);
  const trimmedName = name.trim();
  const initial = trimmedName.charAt(0).toUpperCase();
  const resolvedColorName = colorName ?? stringToThemeColorName(trimmedName);
  const imageUrl = hasImageFailed ? null : readAvatarImageUrl(avatarUrl);

  const frame = {
    alignItems: 'center',
    ...(shape === 'circle'
      ? TASK_CIRCLE_STYLE
      : { borderRadius: Math.max(2, Math.round(size / 4)) }),
    display: 'inline-flex',
    flexShrink: 0,
    height: size,
    justifyContent: 'center',
    overflow: 'hidden',
    width: size,
  } as const;

  if (imageUrl !== null) {
    return (
      <img
        src={imageUrl}
        alt=""
        title={trimmedName}
        onError={() => setHasImageFailed(true)}
        // The tint the initials would have had sits behind the picture, so the
        // circle is already the right colour while the bytes are in flight
        // instead of flashing from nothing to a face.
        style={{
          ...frame,
          background: `var(--t-color-${resolvedColorName}4, ${TASK_TOKENS.backgroundTertiary})`,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <span
      title={trimmedName}
      style={{
        ...frame,
        background: `var(--t-color-${resolvedColorName}4, ${TASK_TOKENS.backgroundTertiary})`,
        color: `var(--t-color-${resolvedColorName}12, ${TASK_TOKENS.textPrimary})`,
        fontFamily: TASK_TOKENS.fontFamily,
        // 0.7, not 0.5: the host's 14px chip avatar carries a 10px letter, and
        // half the box leaves it too small to read at chip size.
        fontSize: Math.round(size * 0.7),
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
};
