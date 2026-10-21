import { t } from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';

import { type HealthLevel } from '../../types/health-dashboard';
import { LEVEL_STYLES } from './health-tokens';

type LevelTagProps = { level: HealthLevel; label?: string };

export const LevelTag = ({ level, label }: LevelTagProps) => (
  <Tag color={LEVEL_STYLES[level].tagColor} weight="medium" preventShrink>
    {label ?? t(LEVEL_STYLES[level].label)}
  </Tag>
);
