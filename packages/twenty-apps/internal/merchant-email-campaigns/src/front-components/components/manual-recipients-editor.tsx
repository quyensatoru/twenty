import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { ESTIMATE_MANUAL_AUDIENCE_ROUTE_PATH } from '../../constants/route-paths';
import { parseManualRecipients } from '../utils/parse-manual-recipients.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { StudioButton } from './studio-button';
import { StudioField } from './studio-field';
import { StudioTextArea } from './studio-text-area';
import { STUDIO_TOKENS } from './studio-tokens';

type ManualRecipientsEditorProps = {
  text: string;
  appIds: string[];
  onChange: (text: string) => void;
};

type AudienceEstimate = {
  totalProvided: number;
  willSend: number;
  skippedUnsubscribed: number;
  matchedMerchants: number;
  ambiguousCount: number;
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
  appIds,
  onChange,
}: ManualRecipientsEditorProps) => {
  const parsed = useMemo(() => parseManualRecipients(text), [text]);
  const [estimate, setEstimate] = useState<AudienceEstimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleEstimate = async () => {
    setIsEstimating(true);
    setEstimateError(null);

    try {
      const result = await postAppRoute<
        { success: boolean } & AudienceEstimate
      >(ESTIMATE_MANUAL_AUDIENCE_ROUTE_PATH, {
        emails: parsed.recipients.map((recipient) => recipient.email),
        appIds,
      });

      setEstimate(result);
    } catch (error) {
      setEstimateError(readErrorText(error));
    } finally {
      setIsEstimating(false);
    }
  };

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
          onChange={(value) => {
            onChange(value);
            setEstimate(null);
          }}
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

      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <StudioButton
          onClick={() => void handleEstimate()}
          isDisabled={isEstimating || parsed.recipients.length === 0}
        >
          {isEstimating ? t('Counting…') : t('Estimate audience')}
        </StudioButton>
        <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
          {t('Checks unsubscribes and merchant matches on the server.')}
        </span>
      </div>

      {estimateError === null ? null : (
        <p style={{ color: STUDIO_TOKENS.textDanger, fontSize: 12, margin: 0 }}>
          {estimateError}
        </p>
      )}

      {estimate === null ? null : (
        <div
          style={{
            background: STUDIO_TOKENS.backgroundSecondary,
            border: `1px solid ${STUDIO_TOKENS.border}`,
            borderRadius: STUDIO_TOKENS.radiusSmall,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 10,
          }}
        >
          <strong style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}>
            {t('{count} will receive this email', {
              count: estimate.willSend.toLocaleString(),
            })}
          </strong>
          <span style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 12 }}>
            {t('{count} already unsubscribed, skipped', {
              count: estimate.skippedUnsubscribed.toLocaleString(),
            })}
            {' · '}
            {t('{count} matched an existing merchant', {
              count: estimate.matchedMerchants.toLocaleString(),
            })}
          </span>
          {estimate.ambiguousCount > 0 && (
            <span style={{ color: STUDIO_TOKENS.red, fontSize: 12 }}>
              {t(
                '{count} address(es) match more than one app for the same email — pick an app above to pick which one gets used.',
                { count: estimate.ambiguousCount.toLocaleString() },
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
