import { useMemo } from 'react';
import { t } from 'twenty-sdk/front-component';

import { parseManualRecipients } from '../utils/parse-manual-recipients.util';
import { StudioField } from './studio-field';
import { StudioTextArea } from './studio-text-area';
import { STUDIO_TOKENS } from './studio-tokens';

type ManualRecipientsEditorProps = {
  text: string;
  onChange: (text: string) => void;
};

const MAX_ERRORS_SHOWN = 20;

// A plain <input type="file"> cannot be used here: this front component runs
// in a sandboxed iframe, and the host hands a selected file over as a
// name/size/type stand-in with no bytes attached (the same shape documented
// on readTransferredFiles.util.ts) — `file.text()` throws every time. Reading
// an uploaded file's real bytes would need its own FILES field and an
// attachment route, same as the Issue Attachments widget, for a feature whose
// outcome a paste already covers: Excel, Google Sheets and any text editor
// all copy out as plain text that lands directly in the textarea below.
export const ManualRecipientsEditor = ({
  text,
  onChange,
}: ManualRecipientsEditorProps) => {
  const parsed = useMemo(() => parseManualRecipients(text), [text]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StudioField
        label={t('Recipients')}
        hint={t(
          'One address per line, optionally followed by a name: "owner@shop.com, Jane Doe". Paste a column from Excel or Google Sheets, or the contents of a .csv/.txt file, directly in here. Addresses already unsubscribed are skipped automatically when the campaign sends.',
        )}
      >
        <StudioTextArea
          value={text}
          rows={10}
          placeholder={'owner@shop.com\nsales@shop.com, Alex'}
          onChange={onChange}
        />
      </StudioField>

      <div
        style={{
          color: STUDIO_TOKENS.textTertiary,
          fontSize: 12,
        }}
      >
        {t('{count} valid recipient(s)', { count: parsed.recipients.length })}
        {parsed.duplicateCount > 0 &&
          ` · ${t('{count} duplicate(s) ignored', { count: parsed.duplicateCount })}`}
        {parsed.errors.length > 0 &&
          ` · ${t('{count} invalid line(s)', { count: parsed.errors.length })}`}
      </div>

      {parsed.errors.length > 0 && (
        <div
          style={{
            background: STUDIO_TOKENS.redSoft,
            borderRadius: STUDIO_TOKENS.radiusSmall,
            display: 'flex',
            flexDirection: 'column',
            fontSize: 12,
            gap: 4,
            padding: 10,
          }}
        >
          {parsed.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
            <span key={error.lineNumber} style={{ color: STUDIO_TOKENS.textDanger }}>
              {t('Line {line}: {message}', {
                line: error.lineNumber,
                message: error.message,
              })}
            </span>
          ))}
          {parsed.errors.length > MAX_ERRORS_SHOWN && (
            <span style={{ color: STUDIO_TOKENS.textDanger }}>
              {t('{count} more line(s) not shown.', {
                count: parsed.errors.length - MAX_ERRORS_SHOWN,
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
