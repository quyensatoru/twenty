import { t } from 'twenty-sdk/front-component';
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconTrash,
} from 'twenty-ui/icon';

import { BLOCK_TYPE_LABELS } from '../../constants/block-type-labels';
import { type EmailBlock } from '../../types/email-block';
import { describeBlock } from '../utils/describe-block.util';
import { StudioIconButton } from './studio-icon-button';
import { STUDIO_TOKENS } from './studio-tokens';

type BlockOutlineProps = {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  onSelect: (blockId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onDuplicate: (blockId: string) => void;
  onRemove: (blockId: string) => void;
};

export const BlockOutline = ({
  blocks,
  selectedBlockId,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
}: BlockOutlineProps) => {
  if (blocks.length === 0) {
    return (
      <p style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12, margin: 0 }}>
        {t('No blocks yet. Add one above.')}
      </p>
    );
  }

  return (
    <ol
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {blocks.map((block, index) => {
        const isSelected = block.id === selectedBlockId;

        return (
          <li
            key={block.id}
            style={{
              alignItems: 'center',
              background: isSelected
                ? STUDIO_TOKENS.accentSoft
                : STUDIO_TOKENS.backgroundSecondary,
              border: `1px solid ${isSelected ? STUDIO_TOKENS.accent : STUDIO_TOKENS.border}`,
              borderRadius: STUDIO_TOKENS.radiusSmall,
              display: 'flex',
              gap: 4,
              padding: '4px 4px 4px 8px',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(block.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
                padding: 0,
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  color: STUDIO_TOKENS.textPrimary,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {t(BLOCK_TYPE_LABELS[block.type])}
              </span>
              <span
                style={{
                  color: STUDIO_TOKENS.textTertiary,
                  fontSize: 11,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {describeBlock(block, t)}
              </span>
            </button>
            <StudioIconButton
              label={t('Move up')}
              isDisabled={index === 0}
              onClick={() => onMove(index, index - 1)}
            >
              <IconArrowUp size={14} />
            </StudioIconButton>
            <StudioIconButton
              label={t('Move down')}
              isDisabled={index === blocks.length - 1}
              onClick={() => onMove(index, index + 1)}
            >
              <IconArrowDown size={14} />
            </StudioIconButton>
            <StudioIconButton
              label={t('Duplicate')}
              onClick={() => onDuplicate(block.id)}
            >
              <IconCopy size={14} />
            </StudioIconButton>
            <StudioIconButton
              label={t('Delete')}
              isDanger
              onClick={() => onRemove(block.id)}
            >
              <IconTrash size={14} />
            </StudioIconButton>
          </li>
        );
      })}
    </ol>
  );
};
