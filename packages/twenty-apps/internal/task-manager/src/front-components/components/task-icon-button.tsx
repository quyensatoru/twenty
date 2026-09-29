import { type ReactNode, useState } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isDisabled?: boolean;
  isDanger?: boolean;
};

// Styled after twenty-ui's LightIconButton.
export const TaskIconButton = ({
  label,
  onClick,
  children,
  isDisabled = false,
  isDanger = false,
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
        background:
          isHovered && !isDisabled ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: isDanger ? TASK_TOKENS.red : TASK_TOKENS.textTertiary,
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
