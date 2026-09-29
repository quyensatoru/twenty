import { useState } from 'react';

import { stringToThemeColorName } from '../../utils/string-to-theme-color.util';
import { readAvatarImageUrl } from '../utils/read-avatar-image-url.util';
import { TASK_TOKENS } from './task-tokens';

type TaskAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

// twenty-ui's Avatar is base-ui backed, and base-ui's event handling throws in
// the sandbox, so the look is reproduced instead: the circle shape Twenty uses
// for people, the first letter of the name, and the palette entry its own hash
// of the name picks.
export const TaskAvatar = ({ name, avatarUrl, size = 24 }: TaskAvatarProps) => {
  const [hasImageFailed, setHasImageFailed] = useState(false);
  const trimmedName = name.trim();
  const initial = trimmedName.charAt(0).toUpperCase();
  const colorName = stringToThemeColorName(trimmedName);
  const imageUrl = hasImageFailed ? null : readAvatarImageUrl(avatarUrl);

  const frame = {
    alignItems: 'center',
    borderRadius: '50%',
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
        style={{ ...frame, objectFit: 'cover' }}
      />
    );
  }

  return (
    <span
      title={trimmedName}
      style={{
        ...frame,
        background: `var(--t-color-${colorName}4, ${TASK_TOKENS.backgroundTertiary})`,
        color: `var(--t-color-${colorName}12, ${TASK_TOKENS.textPrimary})`,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: Math.round(size * 0.5),
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
};
