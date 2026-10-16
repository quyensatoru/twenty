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
  // the host widget under it does. Left out, the row is the issue sidebar's:
  // label and value only, a little taller.
  Icon?: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
};

const SIDEBAR_ROW_HEIGHT = 30;
export const SIDEBAR_FIELD_LABEL_WIDTH = 92;

export const TaskFieldRow = ({ label, Icon, children }: TaskFieldRowProps) => (
  <div
    style={{
      // Top, not centre: a value of several lines (merchants, chats) keeps its
      // label beside its first line rather than floating mid-list.
      alignItems: Icon === undefined ? 'flex-start' : 'center',
      display: 'flex',
      gap: Icon === undefined ? 0 : ROW_GAP,
      minHeight: Icon === undefined ? SIDEBAR_ROW_HEIGHT : LABEL_HEIGHT,
    }}
  >
    {Icon !== undefined && (
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
    )}
    <span
      style={{
        alignItems: 'center',
        boxSizing: 'border-box',
        color: TASK_TOKENS.textTertiary,
        display: 'flex',
        flexShrink: 0,
        // The sidebar's labels sit 8px in, level with the section headings.
        paddingLeft: Icon === undefined ? 8 : 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: TASK_TOKENS.fontSizeSmall,
        height: Icon === undefined ? SIDEBAR_ROW_HEIGHT : LABEL_HEIGHT,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: Icon === undefined ? SIDEBAR_FIELD_LABEL_WIDTH : LABEL_WIDTH,
      }}
    >
      {label}
    </span>
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flex: 1,
        minHeight: Icon === undefined ? SIDEBAR_ROW_HEIGHT : undefined,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  </div>
);
