import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconArrowsSort } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskSortToggleProps = {
  isNewestFirst: boolean;
  onChange: (isNewestFirst: boolean) => void;
};

// Newest first by default: on an issue that has been open a while the comment
// worth reading is the last one, and the composer is already at the top.
export const TaskSortToggle = ({
  isNewestFirst,
  onChange,
}: TaskSortToggleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onChange(!isNewestFirst)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: isHovered ? TASK_TOKENS.textSecondary : TASK_TOKENS.textTertiary,
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 11,
        gap: 4,
        height: 22,
        padding: '0 6px',
      }}
    >
      <IconArrowsSort size={12} />
      {isNewestFirst ? t('Newest first') : t('Oldest first')}
    </button>
  );
};
