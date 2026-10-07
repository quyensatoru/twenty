import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPencil } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

// Jira's "Add a description" invitation as a box, not bare hint text: an empty
// description still has to read as clickable. Top-aligned like a real editor —
// a single line floating mid-box reads as broken. Shared by the record page's
// unified column and the board modal, so the two stay identical.
export const DescriptionEmptyBox = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'flex-start',
        background: TASK_TOKENS.backgroundSecondary,
        border: `1px solid ${isHovered ? TASK_TOKENS.borderStrong : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxSizing: 'border-box',
        color: TASK_TOKENS.textTertiary,
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        gap: 8,
        minHeight: 120,
        padding: '12px 16px',
        width: '100%',
      }}
    >
      <span style={{ display: 'flex', paddingTop: 1 }}>
        <IconPencil size={14} />
      </span>
      {t('Describe the issue…')}
    </div>
  );
};
