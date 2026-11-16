import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { Button } from 'twenty-ui/primitives/input';

import { type SettingsResult, type SettingsSaveBody } from '../../types/settings';
import { formatDate } from '../utils/format.util';
import { BcSelect } from './bc-select';
import { BcField, BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

const Row = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
      display: 'grid',
      gap: spacing(2),
      gridTemplateColumns: '160px 1fr',
      padding: `${spacing(2)} 0`,
    }}
  >
    <span style={{ color: BC_TOKENS.textTertiary }}>{label}</span>
    <span style={{ fontFamily: 'monospace', fontSize: BC_TOKENS.fontSizeSm, wordBreak: 'break-all' }}>
      {value}
    </span>
  </div>
);

const NO_CREDIT = '__none__';

// §9: an admin can move or remove a credit; the server keeps the old value,
// the actor and the reason on the record and the client timeline.
const AttributionCorrectionForm = ({
  settings,
  isSaving,
  onSave,
}: {
  settings: SettingsResult;
  isSaving: boolean;
  onSave: (body: SettingsSaveBody) => Promise<boolean>;
}) => {
  const records = settings.attributionRecords;
  const [recordKey, setRecordKey] = useState('');
  const [memberId, setMemberId] = useState(NO_CREDIT);
  const [reason, setReason] = useState('');
  const selected = records.find((record) => `${record.kind}:${record.id}` === recordKey);
  const memberOptions = [
    { value: NO_CREDIT, label: t('No BC credit') },
    ...settings.members
      .filter((member) => member.workspaceMemberId !== null)
      .filter(
        (member, index, all) =>
          all.findIndex((other) => other.workspaceMemberId === member.workspaceMemberId) === index,
      )
      .map((member) => ({ value: member.workspaceMemberId as string, label: member.name })),
  ];

  if (records.length === 0) {
    return (
      <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
        {t('No upgrade or review to correct yet.')}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
      <BcField label={t('Upgrade or review')}>
        <BcSelect
          ariaLabel={t('Upgrade or review')}
          value={recordKey}
          menuWidth={420}
          options={[
            { value: '', label: t('Choose a record…') },
            ...records.map((record) => ({
              value: `${record.kind}:${record.id}`,
              label: `${record.clientName} · ${record.label}`,
              description: `${formatDate(record.occurredAt)} · ${
                record.creditedMemberName ?? t('No BC credit')
              }`,
            })),
          ]}
          onChange={(value) => {
            const next = records.find((record) => `${record.kind}:${record.id}` === value);

            setRecordKey(value);
            setMemberId(next?.creditedMemberId ?? NO_CREDIT);
          }}
        />
      </BcField>
      <BcField label={t('Credit goes to')}>
        <BcSelect
          ariaLabel={t('Credit goes to')}
          value={memberId}
          options={memberOptions}
          onChange={setMemberId}
          isDisabled={selected === undefined}
        />
      </BcField>
      <BcField label={t('Reason')} isRequired>
        <BcTextInput
          ariaLabel={t('Reason')}
          value={reason}
          maxLength={500}
          placeholder={t('e.g. the outreach was by another BC')}
          onChange={setReason}
        />
      </BcField>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          disabled={isSaving || selected === undefined || reason.trim().length === 0}
          onClick={() => {
            if (selected === undefined) {
              return;
            }

            void onSave({
              action: 'correctAttribution',
              ...(selected.kind === 'REVIEW'
                ? { reviewId: selected.id }
                : { subscriptionEventId: selected.id }),
              memberId: memberId === NO_CREDIT ? null : memberId,
              reason,
            }).then((isSaved) => {
              if (isSaved) {
                setRecordKey('');
                setReason('');
              }
            });
          }}
        >
          {t('Correct credit')}
        </Button>
      </div>
    </div>
  );
};

export const SettingsIntegrationsTab = ({
  settings,
  isSaving,
  onSave,
}: {
  settings: SettingsResult;
  isSaving: boolean;
  onSave: (body: SettingsSaveBody) => Promise<boolean>;
}) => {
  const { integrations } = settings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), padding: spacing(4) }}>
      <span style={{ color: BC_TOKENS.textSecondary, fontSize: BC_TOKENS.fontSizeSm }}>
        {t('Billing, usage, review and meeting systems POST JSON to these endpoints with a workspace API key. Every call carries its own id, so retries are safe. See BC_WORKSPACE.md for the request bodies.')}
      </span>
      <div>
        {integrations.ingestPaths.map((ingestPath) => (
          <Row key={ingestPath.path} label={t(ingestPath.name)} value={`POST ${ingestPath.path}`} />
        ))}
        <Row label={t('Secret header')} value={integrations.secretHeader} />
        <Row
          label={t('Ingest secret')}
          value={integrations.isSecretSet ? t('Set') : t('Not set: only the API key protects the endpoints')}
        />
        <Row
          label={t('AI issue detection')}
          value={integrations.isAiIssueDetectionEnabled ? t('On') : t('Off')}
        />
        <Row label={t('Base currency')} value={integrations.baseCurrency} />
        <Row
          label={t('No-reply follow-up')}
          value={t('{hours} hours', { hours: integrations.noReplyHours })}
        />
      </div>
      <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
        {t('These values are application variables, changed in Settings > Applications > BC Workspace.')}
      </span>
      <div
        style={{
          borderTop: `1px solid ${BC_TOKENS.borderLight}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(2),
          paddingTop: spacing(3),
        }}
      >
        <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{t('Correct a credit')}</span>
        <span style={{ color: BC_TOKENS.textSecondary, fontSize: BC_TOKENS.fontSizeSm }}>
          {t('Move or remove the BC credit of an upgrade or review. The previous credit, who changed it and why stay on the record and the client timeline.')}
        </span>
        <AttributionCorrectionForm settings={settings} isSaving={isSaving} onSave={onSave} />
      </div>
    </div>
  );
};
