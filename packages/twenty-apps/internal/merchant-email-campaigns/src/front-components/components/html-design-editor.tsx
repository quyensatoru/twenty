import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { type EmailDesign } from '../../types/email-design';
import { convertBlocksToHtml } from '../../utils/convert-blocks-to-html.util';
import { hasUnsubscribePlaceholder } from '../../utils/has-unsubscribe-placeholder.util';
import { CodeEditor } from './code-editor';
import { StudioButton } from './studio-button';
import { StudioField } from './studio-field';
import { StudioPanel } from './studio-panel';
import { StudioSegmentedControl } from './studio-segmented-control';
import { StudioTextArea } from './studio-text-area';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';
import { VariableChips } from './variable-chips';

type CodeTab = 'html' | 'css';

type HtmlDesignEditorProps = {
  design: EmailDesign;
  onChange: (design: EmailDesign) => void;
};

export const HtmlDesignEditor = ({
  design,
  onChange,
}: HtmlDesignEditorProps) => {
  const [tab, setTab] = useState<CodeTab>('html');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const update = (partial: Partial<EmailDesign>) =>
    onChange({ ...design, ...partial });
  const hasOwnUnsubscribeLink = hasUnsubscribePlaceholder(design.html);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <StudioPanel
        actions={
          <StudioSegmentedControl
            value={tab}
            options={[
              { value: 'html', label: 'HTML' },
              { value: 'css', label: 'CSS' },
            ]}
            onChange={setTab}
          />
        }
        title={tab === 'html' ? t('HTML body') : t('Stylesheet')}
      >
        {tab === 'html' ? (
          <>
            <CodeEditor
              value={design.html}
              placeholder={
                '<table width="100%">\n  <tr><td class="content">Hi {{contactName|there}}</td></tr>\n</table>'
              }
              onChange={(html) => update({ html })}
            />
            <VariableChips
              onInsert={(placeholder) =>
                update({ html: `${design.html}${placeholder}` })
              }
            />
            <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 11 }}>
              {t(
                'A fragment is wrapped in a full document; a full <html> document is used as written. Scripts and on* attributes are removed. Variables are HTML-escaped.',
              )}
            </span>
          </>
        ) : (
          <>
            <CodeEditor
              value={design.css}
              placeholder={
                '.content { font-family: Helvetica, Arial, sans-serif; color: #333333; }\n@media (max-width: 600px) { .content { padding: 16px; } }'
              }
              onChange={(css) => update({ css })}
            />
            <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 11 }}>
              {t(
                'Rules are copied inline onto the matching elements when the email is sent, because Gmail and Outlook ignore most <style> rules. Media queries stay in a <style> tag.',
              )}
            </span>
          </>
        )}
      </StudioPanel>

      <StudioPanel title={t('Unsubscribe footer')}>
        <span
          style={{
            color: hasOwnUnsubscribeLink
              ? STUDIO_TOKENS.green
              : STUDIO_TOKENS.textSecondary,
            fontSize: 12,
          }}
        >
          {hasOwnUnsubscribeLink
            ? t('Your HTML links to {{unsubscribeUrl}}, so no footer is added.')
            : t(
                'Your HTML has no {{unsubscribeUrl}} link, so this footer is added at the bottom.',
              )}
        </span>
        {hasOwnUnsubscribeLink ? null : (
          <>
            <StudioField label={t('Footer text')}>
              <StudioTextArea
                value={design.settings.footerText}
                rows={2}
                onChange={(footerText) =>
                  update({ settings: { ...design.settings, footerText } })
                }
              />
            </StudioField>
            <StudioField label={t('Link label')}>
              <StudioTextInput
                value={design.settings.unsubscribeLabel}
                onChange={(unsubscribeLabel) =>
                  update({ settings: { ...design.settings, unsubscribeLabel } })
                }
              />
            </StudioField>
          </>
        )}
      </StudioPanel>

      <StudioPanel title={t('Start over')}>
        <span style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 12 }}>
          {t(
            'Replace the HTML with the block design converted to HTML. The CSS is kept.',
          )}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {isConfirmingReset ? (
            <>
              <StudioButton
                variant="ghost"
                onClick={() => setIsConfirmingReset(false)}
              >
                {t('Keep my HTML')}
              </StudioButton>
              <StudioButton
                variant="danger"
                onClick={() => {
                  update({ html: convertBlocksToHtml(design) });
                  setIsConfirmingReset(false);
                }}
              >
                {t('Replace HTML')}
              </StudioButton>
            </>
          ) : (
            <StudioButton onClick={() => setIsConfirmingReset(true)}>
              {t('Convert block design to HTML')}
            </StudioButton>
          )}
        </div>
      </StudioPanel>
    </div>
  );
};
