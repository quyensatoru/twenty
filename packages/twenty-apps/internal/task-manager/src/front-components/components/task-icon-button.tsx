import { type ReactNode, useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isDisabled?: boolean;
  isDanger?: boolean;
  // The host's inline-cell edit button is `elevated`: a white 24px button with
  // a border and a small shadow, so it reads as sitting over the value rather
  // than beside it. Its other icon buttons stay flat.
  isElevated?: boolean;
};

// Styled after twenty-ui's LightIconButton.
export const TaskIconButton = ({
  label,
  onClick,
  children,
  isDisabled = false,
  isDanger = false,
  isElevated = false,
}: TaskIconButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isElevated
          ? TASK_TOKENS.background
          : isHovered && !isDisabled
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
        border: isElevated ? `1px solid ${TASK_TOKENS.borderLight}` : 'none',
        borderRadius: isElevated
          ? TASK_TOKENS.radius
          : TASK_TOKENS.radiusSmall,
        boxShadow: isElevated ? TASK_TOKENS.shadowLight : 'none',
        // Red only under the pointer: a delete sitting in an always-visible
        // action row would otherwise shout louder than the content it serves.
        color:
          isDanger && isHovered && !isDisabled
            ? TASK_TOKENS.red
            : TASK_TOKENS.textTertiary,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 24,
        justifyContent: 'center',
        opacity: isDisabled ? 0.35 : 1,
        padding: 0,
        width: 24,
      }}
    >
      {children}
    </button>
  );
};
