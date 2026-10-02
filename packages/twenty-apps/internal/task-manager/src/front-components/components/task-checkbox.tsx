import { IconCheck } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

// Checkbox.module.scss, `solid sm square accent`: a 12px box inside a 1px
// border, filled with the accent and carrying a white tick once it is on.
// twenty-ui's own Checkbox is base-ui backed and throws in the sandbox, so the
// look is reproduced from its stylesheet rather than imported.
const BOX_SIZE = 12;
const BORDER_WIDTH = 1;
const ICON_SIZE = 14;

export const TaskCheckbox = ({ isChecked }: { isChecked: boolean }) => (
  <span
    aria-hidden
    style={{
      alignItems: 'center',
      background: isChecked ? TASK_TOKENS.accent : 'transparent',
      border: `${BORDER_WIDTH}px solid ${
        isChecked ? TASK_TOKENS.accent : TASK_TOKENS.borderInverted
      }`,
      borderRadius: TASK_TOKENS.radiusExtraSmall,
      boxSizing: 'content-box',
      display: 'inline-flex',
      flexShrink: 0,
      height: BOX_SIZE,
      justifyContent: 'center',
      position: 'relative',
      width: BOX_SIZE,
    }}
  >
    {isChecked && (
      <IconCheck size={ICON_SIZE} color={TASK_TOKENS.textInverted} />
    )}
  </span>
);
