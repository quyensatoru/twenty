import {
  IconArrowsVertical,
  IconClick,
  IconH1,
  IconMinus,
  IconPhoto,
  IconTypography,
} from 'twenty-ui/icon';

import { type EmailBlockType } from '../../types/email-block';

const BLOCK_ICONS = {
  heading: IconH1,
  text: IconTypography,
  button: IconClick,
  image: IconPhoto,
  divider: IconMinus,
  spacer: IconArrowsVertical,
} as const;

export const BlockIcon = ({
  type,
  size = 14,
}: {
  type: EmailBlockType;
  size?: number;
}) => {
  const Icon = BLOCK_ICONS[type];

  return <Icon size={size} />;
};
