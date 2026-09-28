import { t } from 'twenty-sdk/front-component';
import { type EmailDesignSettings } from '../../types/email-design';
import { StudioColorInput } from './studio-color-input';
import { StudioField } from './studio-field';
import { StudioSelect } from './studio-select';
import { StudioTextArea } from './studio-text-area';
import { STUDIO_TOKENS } from './studio-tokens';
import { VariableChips } from './variable-chips';

const FONT_OPTIONS = [
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica / Arial' },
  {
    value: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    label: 'System UI',
  },
  { value: 'Georgia, Times, serif', label: 'Georgia (serif)' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
] as const;

const WIDTH_OPTIONS = [
  { value: '520', label: '520px (narrow)' },
  { value: '600', label: '600px (standard)' },
  { value: '680', label: '680px (wide)' },
] as const;

type DesignSettingsProps = {
  settings: EmailDesignSettings;
  onChange: (settings: EmailDesignSettings) => void;
};

export const DesignSettings = ({ settings, onChange }: DesignSettingsProps) => {
  const update = (partial: Partial<EmailDesignSettings>) =>
    onChange({ ...settings, ...partial });
  const fontOption = FONT_OPTIONS.find(
    (option) => option.value === settings.fontFamily,
  );

  return (
    <>
      <h3
        style={{
          color: STUDIO_TOKENS.textPrimary,
          fontSize: 13,
          fontWeight: 600,
          margin: 0,
        }}
      >
        {t('Email style')}
      </h3>
      <StudioField label={t('Font')}>
        <StudioSelect
          value={fontOption?.value ?? FONT_OPTIONS[0].value}
          options={FONT_OPTIONS}
          onChange={(fontFamily) => update({ fontFamily })}
        />
      </StudioField>
      <StudioField label={t('Content width')}>
        <StudioSelect
          value={
            (String(settings.contentWidth) as '520' | '600' | '680') ?? '600'
          }
          options={WIDTH_OPTIONS}
          onChange={(width) => update({ contentWidth: Number(width) })}
        />
      </StudioField>
      <StudioField label={t('Page background')}>
        <StudioColorInput
          value={settings.backgroundColor}
          onChange={(backgroundColor) => update({ backgroundColor })}
        />
      </StudioField>
      <StudioField label={t('Content background')}>
        <StudioColorInput
          value={settings.contentBackgroundColor}
          onChange={(contentBackgroundColor) =>
            update({ contentBackgroundColor })
          }
        />
      </StudioField>
      <StudioField label={t('Text color')}>
        <StudioColorInput
          value={settings.textColor}
          onChange={(textColor) => update({ textColor })}
        />
      </StudioField>
      <StudioField label={t('Link color')}>
        <StudioColorInput
          value={settings.linkColor}
          onChange={(linkColor) => update({ linkColor })}
        />
      </StudioField>
      <StudioField
        label={t('Footer')}
        hint={t('An unsubscribe link is always added below the footer.')}
      >
        <StudioTextArea
          value={settings.footerText}
          rows={3}
          onChange={(footerText) => update({ footerText })}
        />
      </StudioField>
      <VariableChips
        onInsert={(placeholder) =>
          update({ footerText: `${settings.footerText}${placeholder}` })
        }
      />
    </>
  );
};
