import type { CSSProperties } from 'react';

import { TASK_TOKENS } from './task-tokens';

type TaskSkeletonBarProps = {
  width?: number | string;
  height?: number;
  background?: string;
  radius?: string;
  style?: CSSProperties;
};

// A static placeholder bar. Static on purpose: an app ships no stylesheet, so
// there is no keyframe shimmer to declare — a quiet bar still reads as loading
// beside the panel it stands in for.
export const TaskSkeletonBar = ({
  width = '100%',
  height = 12,
  background = TASK_TOKENS.backgroundTertiary,
  radius = TASK_TOKENS.radiusExtraSmall,
  style,
}: TaskSkeletonBarProps) => (
  <div
    aria-hidden="true"
    style={{
      background,
      borderRadius: radius,
      flexShrink: 0,
      height,
      width,
      ...style,
    }}
  />
);

type TaskSkeletonLinesProps = {
  widths: number[];
  style?: CSSProperties;
};

// Stacked text-like bars for prose panels. Top-aligned so the rest of a tall
// widget stays blank instead of filling with gray.
export const TaskSkeletonLines = ({ widths, style }: TaskSkeletonLinesProps) => (
  <div
    aria-hidden="true"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style,
    }}
  >
    {widths.map((width, index) => (
      <TaskSkeletonBar key={`${width}-${index}`} width={`${width}%`} />
    ))}
  </div>
);

type TaskSkeletonFieldRowProps = {
  valueWidth: number;
};

// One label/value row echoing the Details panel: a short label bar and a value
// bar that flexes like the chip or text sitting there once loaded.
export const TaskSkeletonFieldRow = ({
  valueWidth,
}: TaskSkeletonFieldRowProps) => (
  <div
    aria-hidden="true"
    style={{ alignItems: 'center', display: 'flex', gap: 12 }}
  >
    <TaskSkeletonBar width={88} />
    <TaskSkeletonBar
      width={`${valueWidth}%`}
      height={20}
      radius={TASK_TOKENS.radiusSmall}
      style={{ flexShrink: 1, minWidth: 0 }}
    />
  </div>
);

type TaskSkeletonAvatarRowProps = {
  lines: number[];
};

// One feed row echoing a loaded comment or worklog: avatar circle plus text
// bars, indented to the row text column like the composer above it.
export const TaskSkeletonAvatarRow = ({ lines }: TaskSkeletonAvatarRowProps) => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', gap: 12, padding: '12px' }}
  >
    <TaskSkeletonBar width={24} height={24} radius="50%" />
    <TaskSkeletonLines widths={lines} style={{ flex: 1, minWidth: 0 }} />
  </div>
);
