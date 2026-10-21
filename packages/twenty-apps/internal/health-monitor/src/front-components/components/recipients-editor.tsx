import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPlus, IconX } from 'twenty-ui/icon';
import { Avatar, Tag } from 'twenty-ui/primitives/data-display';
import { Button, SegmentedControl } from 'twenty-ui/primitives/input';

import { type HealthRecipient } from '../../types/health-recipient';
import { type HealthMemberOption } from '../../types/health-route-results';
import { HEALTH_TOKENS, spacing } from './health-tokens';
import { TextInput } from './text-input';

type RecipientsEditorProps = {
  recipients: HealthRecipient[];
  extraEmails: string[];
  members: HealthMemberOption[];
  onAddRecipient: (memberId: string) => void;
  onRemoveRecipient: (memberId: string) => void;
  onChangeSeverity: (
    memberId: string,
    minSeverity: HealthRecipient['minSeverity'],
  ) => void;
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
};

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing(2.5),
  padding: `${spacing(2)} ${spacing(3)}`,
  borderBottom: `1px solid ${HEALTH_TOKENS.borderLight}`,
} as const;

export const RecipientsEditor = ({
  recipients,
  extraEmails,
  members,
  onAddRecipient,
  onRemoveRecipient,
  onChangeSeverity,
  onAddEmail,
  onRemoveEmail,
}: RecipientsEditorProps) => {
  const [search, setSearch] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const memberById = new Map(members.map((member) => [member.id, member]));
  const selectedIds = new Set(
    recipients.map((recipient) => recipient.memberId),
  );
  const query = search.trim().toLowerCase();
  const candidates = members
    .filter((member) => !selectedIds.has(member.id))
    .filter(
      (member) =>
        query.length === 0 ||
        `${member.name} ${member.email ?? ''}`.toLowerCase().includes(query),
    )
    .slice(0, 6);
  const severityOptions = [
    { value: 'WARNING' as const, label: t('All alerts') },
    { value: 'CRITICAL' as const, label: t('Critical only') },
  ];

  const addEmail = () => {
    const email = emailDraft.trim();

    if (email.length > 0) {
      onAddEmail(email);
      setEmailDraft('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${HEALTH_TOKENS.border}`,
          borderRadius: HEALTH_TOKENS.radius,
        }}
      >
        {recipients.length === 0 && (
          <span
            style={{ padding: spacing(3), color: HEALTH_TOKENS.textTertiary }}
          >
            {t('Nobody gets alerts yet. Add members below.')}
          </span>
        )}
        {recipients.map((recipient) => {
          const member = memberById.get(recipient.memberId);
          const name = member?.name ?? t('Former member');

          return (
            <div key={recipient.memberId} style={rowStyle}>
              <Avatar
                name={name}
                colorSeed={recipient.memberId}
                src={member?.avatarUrl ?? null}
                size="md"
              />
              <span
                style={{
                  flex: '1 1 160px',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(1.5),
                    fontWeight: HEALTH_TOKENS.fontWeightMedium,
                  }}
                >
                  {name}
                  {member?.hasAppAccess === true && (
                    <Tag color="blue" weight="medium" preventShrink>
                      {t('App access')}
                    </Tag>
                  )}
                </span>
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color: HEALTH_TOKENS.textTertiary,
                  }}
                >
                  {member?.email ?? t('No email')}
                </span>
              </span>
              <SegmentedControl
                aria-label={t('Alert level for {name}', { name })}
                value={recipient.minSeverity}
                onValueChange={(value) =>
                  onChangeSeverity(
                    recipient.memberId,
                    value === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
                  )
                }
                options={severityOptions}
              />
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                aria-label={t('Remove {name}', { name })}
                startIcon={<IconX size={16} />}
                onClick={() => onRemoveRecipient(recipient.memberId)}
              />
            </div>
          );
        })}
        <div
          style={{
            padding: spacing(3),
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(2),
          }}
        >
          <TextInput
            type="search"
            ariaLabel={t('Search members')}
            placeholder={t('Search members to add')}
            value={search}
            onChange={setSearch}
          />
          {candidates.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing(2.5),
              }}
            >
              <Avatar
                name={member.name}
                colorSeed={member.id}
                src={member.avatarUrl}
                size="sm"
              />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1.5),
                }}
              >
                {member.name}
                {member.hasAppAccess && (
                  <Tag color="blue" weight="medium" preventShrink>
                    {t('App access')}
                  </Tag>
                )}
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color: HEALTH_TOKENS.textTertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {member.email}
                </span>
              </span>
              <Button
                variant="outline"
                color="neutral"
                size="sm"
                startIcon={<IconPlus size={16} />}
                disabled={member.email === null}
                onClick={() => onAddRecipient(member.id)}
              >
                {t('Add')}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}
      >
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textSecondary,
          }}
        >
          {t('Emails outside the workspace (get every alert)')}
        </span>
        {extraEmails.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1.5) }}>
            {extraEmails.map((email) => (
              <span
                key={email}
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <Tag color="gray" weight="medium" preventShrink>
                  {email}
                </Tag>
                <Button
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  aria-label={t('Remove {name}', { name: email })}
                  startIcon={<IconX size={14} />}
                  onClick={() => onRemoveEmail(email)}
                />
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: spacing(2) }}>
          <TextInput
            type="email"
            ariaLabel={t('Email outside the workspace')}
            placeholder="ops@example.com"
            value={emailDraft}
            onChange={setEmailDraft}
            onEnter={addEmail}
          />
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            onClick={addEmail}
          >
            {t('Add')}
          </Button>
        </div>
      </div>
    </div>
  );
};
