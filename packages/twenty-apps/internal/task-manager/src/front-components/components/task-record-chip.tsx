import { TaskAvatar } from './task-avatar';
import { TASK_TOKENS } from './task-tokens';

type TaskRecordChipProps = {
  name: string;
  avatarUrl?: string | null;
  // Twenty draws people as circles and every other record as a rounded square.
  shape?: 'circle' | 'square';
  // Printed after the name in lighter text, for the cases where the name alone
  // does not identify the record: two people called the same thing, or someone
  // who can no longer be picked.
  detail?: string;
};

// Measured on the host's own relation chip: a 20px pill with a 4px inset and
// radius, a 14px avatar, and 4px between the two.
const CHIP_HEIGHT = 20;
const CHIP_AVATAR_SIZE = 14;
const CHIP_PADDING = 4;
const CHIP_GAP = 4;

// A record as Twenty shows one in a field: avatar, name, on a faint tinted pill.
// The coloured pill is for an enum (TaskTag); a record's is always this neutral
// one, and its picture is what identifies it.
export const TaskRecordChip = ({
  name,
  avatarUrl,
  shape = 'circle',
  detail,
}: TaskRecordChipProps) => (
  <span
    style={{
      alignItems: 'center',
      background: TASK_TOKENS.backgroundTransparentLight,
      borderRadius: TASK_TOKENS.radiusExtraSmall,
      boxSizing: 'border-box',
      display: 'inline-flex',
      gap: CHIP_GAP,
      height: CHIP_HEIGHT,
      minWidth: 0,
      padding: CHIP_PADDING,
    }}
  >
    <TaskAvatar
      name={name}
      avatarUrl={avatarUrl}
      size={CHIP_AVATAR_SIZE}
      shape={shape}
    />
    <span
      style={{
        color: TASK_TOKENS.textPrimary,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
    {detail !== undefined && (
      <span
        style={{
          color: TASK_TOKENS.textTertiary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {detail}
      </span>
    )}
  </span>
);
