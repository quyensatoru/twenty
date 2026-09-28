import { t } from 'twenty-sdk/front-component';
import { BLOCK_TYPE_LABELS } from '../../constants/block-type-labels';
import { type EmailBlock } from '../../types/email-block';
import { ALIGN_OPTIONS } from './align-options';
import { StudioColorInput } from './studio-color-input';
import { StudioField } from './studio-field';
import { StudioSegmentedControl } from './studio-segmented-control';
import { StudioTextArea } from './studio-text-area';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';
import { VariableChips } from './variable-chips';

type BlockSettingsProps = {
  block: EmailBlock;
  onChange: (block: EmailBlock) => void;
};

const readNumber = (value: string, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const BlockSettings = ({ block, onChange }: BlockSettingsProps) => {
  const title = (
    <h3
      style={{
        color: STUDIO_TOKENS.textPrimary,
        fontSize: 13,
        fontWeight: 600,
        margin: 0,
      }}
    >
      {t(BLOCK_TYPE_LABELS[block.type])}
    </h3>
  );

  switch (block.type) {
    case 'heading':
      return (
        <>
          {title}
          <StudioField label={t('Text')}>
            <StudioTextInput
              value={block.text}
              onChange={(text) => onChange({ ...block, text })}
            />
          </StudioField>
          <VariableChips
            onInsert={(placeholder) =>
              onChange({ ...block, text: `${block.text}${placeholder}` })
            }
          />
          <StudioField label={t('Size')}>
            <StudioSegmentedControl
              value={String(block.level) as '1' | '2' | '3'}
              options={[
                { value: '1', label: 'Large' },
                { value: '2', label: 'Medium' },
                { value: '3', label: 'Small' },
              ]}
              onChange={(level) =>
                onChange({ ...block, level: Number(level) as 1 | 2 | 3 })
              }
            />
          </StudioField>
          <StudioField label={t('Alignment')}>
            <StudioSegmentedControl
              value={block.align}
              options={ALIGN_OPTIONS}
              onChange={(align) => onChange({ ...block, align })}
            />
          </StudioField>
        </>
      );
    case 'text':
      return (
        <>
          {title}
          <StudioField
            label={t('Text')}
            hint={t(
              '**bold**, *italic*, [label](https://url). A blank line starts a new paragraph.',
            )}
          >
            <StudioTextArea
              value={block.text}
              rows={8}
              onChange={(text) => onChange({ ...block, text })}
            />
          </StudioField>
          <VariableChips
            onInsert={(placeholder) =>
              onChange({ ...block, text: `${block.text}${placeholder}` })
            }
          />
          <StudioField label={t('Alignment')}>
            <StudioSegmentedControl
              value={block.align}
              options={ALIGN_OPTIONS}
              onChange={(align) => onChange({ ...block, align })}
            />
          </StudioField>
        </>
      );
    case 'button':
      return (
        <>
          {title}
          <StudioField label={t('Label')}>
            <StudioTextInput
              value={block.label}
              onChange={(label) => onChange({ ...block, label })}
            />
          </StudioField>
          <StudioField
            label={t('Link')}
            hint={t(
              'Variables work here too, e.g. https://{{shopDomain}}/admin/apps',
            )}
          >
            <StudioTextInput
              type="url"
              value={block.url}
              onChange={(url) => onChange({ ...block, url })}
            />
          </StudioField>
          <VariableChips
            onInsert={(placeholder) =>
              onChange({ ...block, url: `${block.url}${placeholder}` })
            }
          />
          <StudioField label={t('Button color')}>
            <StudioColorInput
              value={block.backgroundColor}
              onChange={(backgroundColor) =>
                onChange({ ...block, backgroundColor })
              }
            />
          </StudioField>
          <StudioField label={t('Text color')}>
            <StudioColorInput
              value={block.textColor}
              onChange={(textColor) => onChange({ ...block, textColor })}
            />
          </StudioField>
          <StudioField label={t('Alignment')}>
            <StudioSegmentedControl
              value={block.align}
              options={ALIGN_OPTIONS}
              onChange={(align) => onChange({ ...block, align })}
            />
          </StudioField>
        </>
      );
    case 'image':
      return (
        <>
          {title}
          <StudioField
            label={t('Image URL')}
            hint={t('Public https URL. Keep images under 1 MB.')}
          >
            <StudioTextInput
              type="url"
              value={block.src}
              onChange={(src) => onChange({ ...block, src })}
            />
          </StudioField>
          <StudioField label={t('Alt text')}>
            <StudioTextInput
              value={block.alt}
              onChange={(alt) => onChange({ ...block, alt })}
            />
          </StudioField>
          <StudioField label={t('Link (optional)')}>
            <StudioTextInput
              type="url"
              value={block.href}
              onChange={(href) => onChange({ ...block, href })}
            />
          </StudioField>
          <StudioField
            label={t('Width')}
            hint={t('10 to 100% of the content width.')}
          >
            <StudioTextInput
              type="number"
              suffix="%"
              value={String(block.widthPercent)}
              onChange={(value) =>
                onChange({
                  ...block,
                  widthPercent: Math.min(
                    100,
                    Math.max(10, readNumber(value, 100)),
                  ),
                })
              }
            />
          </StudioField>
          <StudioField label={t('Alignment')}>
            <StudioSegmentedControl
              value={block.align}
              options={ALIGN_OPTIONS}
              onChange={(align) => onChange({ ...block, align })}
            />
          </StudioField>
        </>
      );
    case 'divider':
      return (
        <>
          {title}
          <StudioField label={t('Color')}>
            <StudioColorInput
              value={block.color}
              onChange={(color) => onChange({ ...block, color })}
            />
          </StudioField>
        </>
      );
    case 'spacer':
      return (
        <>
          {title}
          <StudioField label={t('Height')}>
            <StudioTextInput
              type="number"
              suffix="px"
              value={String(block.height)}
              onChange={(value) =>
                onChange({
                  ...block,
                  height: Math.min(200, Math.max(0, readNumber(value, 24))),
                })
              }
            />
          </StudioField>
        </>
      );
  }
};
