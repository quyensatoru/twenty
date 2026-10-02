import { type ComponentType, type ReactNode } from 'react';

import { TASK_TOKENS } from './task-tokens';

// RecordInlineCellContainer lays a row out as three boxes with a 4px gap:
// StyledIconContainer at 16, StyledLabelContainer at the `labelWidth` the
// fields widget passes down (90), then the value. Reproduced to the pixel,
// because the panel sits directly above one of those rows and any difference
// shows as two columns that do not line up — the icon inside the 90 rather
// than beside it put this panel's values 20px left of the host's.
const ICON_WIDTH = 16;
const LABEL_WIDTH = 90;
const ROW_GAP = 4;
// StyledLabelAndIconContainer is a fixed 24px; the value is as tall as its
// content.
const LABEL_HEIGHT = 24;

type TaskFieldRowProps = {
  label: string;
  // The icon the field itself declares, so this panel names a field exactly as
  // the host widget under it does.
  Icon: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
};

export const TaskFieldRow = ({ label, Icon, children }: TaskFieldRowProps) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      gap: ROW_GAP,
      minHeight: LABEL_HEIGHT,
    }}
  >
    <span
      style={{
        alignItems: 'center',
        color: TASK_TOKENS.textTertiary,
        display: 'flex',
        flexShrink: 0,
        height: LABEL_HEIGHT,
        width: ICON_WIDTH,
      }}
    >
      <Icon size={ICON_WIDTH} color={TASK_TOKENS.textTertiary} />
    </span>
    <span
      style={{
        alignItems: 'center',
        color: TASK_TOKENS.textTertiary,
        display: 'flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: TASK_TOKENS.fontSizeSmall,
        height: LABEL_HEIGHT,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: LABEL_WIDTH,
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>{children}</div>
  </div>
);
