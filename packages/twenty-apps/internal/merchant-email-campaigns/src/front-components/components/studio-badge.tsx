import { Tag } from 'twenty-ui/primitives/data-display';

import { type StudioBadgeTone } from '../../types/studio-badge-tone';

const TAG_COLORS = {
  gray: 'gray',
  green: 'green',
  orange: 'orange',
  red: 'red',
  blue: 'blue',
} as const;

type StudioBadgeProps = { label: string; tone: StudioBadgeTone };

export const StudioBadge = ({ label, tone }: StudioBadgeProps) => (
  <Tag color={TAG_COLORS[tone]} weight="medium" preventShrink>
    {label}
  </Tag>
);
