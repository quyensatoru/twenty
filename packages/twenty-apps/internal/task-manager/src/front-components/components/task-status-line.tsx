import { TASK_TOKENS } from './task-tokens';

type TaskStatusLineProps = {
  text: string | null;
  tone?: 'muted' | 'danger';
};

const STATUS_LINE_HEIGHT = 16;

// A save state and an error are the two things on this page that come and go
// while the author is looking at it, so the line they print in is always in the
// layout and only its content is toggled — appearing must not push the box the
// author is typing in.
export const TaskStatusLine = ({
  text,
  tone = 'muted',
}: TaskStatusLineProps) => (
  <span
    aria-live="polite"
    style={{
      color:
        tone === 'danger' ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary,
      flexShrink: 0,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 11,
      height: STATUS_LINE_HEIGHT,
      lineHeight: `${STATUS_LINE_HEIGHT}px`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      visibility: text === null ? 'hidden' : 'visible',
      whiteSpace: 'nowrap',
    }}
  >
    {text ?? ' '}
  </span>
);
