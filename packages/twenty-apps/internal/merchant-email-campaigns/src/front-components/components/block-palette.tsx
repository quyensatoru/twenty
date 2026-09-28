import { t } from 'twenty-sdk/front-component';
import { BLOCK_TYPE_LABELS } from '../../constants/block-type-labels';
import { type EmailBlockType } from '../../types/email-block';

import { BlockIcon } from './block-icon';
import { StudioButton } from './studio-button';

const BLOCK_TYPES: EmailBlockType[] = [
  'heading',
  'text',
  'button',
  'image',
  'divider',
  'spacer',
];

type BlockPaletteProps = {
  onAdd: (type: EmailBlockType) => void;
};

export const BlockPalette = ({ onAdd }: BlockPaletteProps) => (
  <div
    style={{
      display: 'grid',
      gap: 6,
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    }}
  >
    {BLOCK_TYPES.map((type) => (
      <StudioButton
        key={type}
        isFullWidth
        startIcon={<BlockIcon type={type} />}
        onClick={() => onAdd(type)}
      >
        {t(BLOCK_TYPE_LABELS[type])}
      </StudioButton>
    ))}
  </div>
);
