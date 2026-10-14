import { type ReactNode, useState } from 'react';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
} from 'twenty-sdk/front-component';
import {
  IconCalendar,
  IconCheckbox,
  IconCopy,
  IconMail,
  IconNumber,
  IconPhone,
  IconRelationManyToMany,
  IconShoppingBag,
  IconTag,
  IconTextSize,
  IconUserCircle,
  IconWorldWww,
} from 'twenty-ui/icon';

import { type MerchantRecordField } from '../hooks/use-merchant-record-fields';
import { useMerchantRecordFields } from '../hooks/use-merchant-record-fields';
import { useMerchantPreview } from '../hooks/use-merchant-preview';
import { ConversationStatusPill } from '../support-conversation/components/conversation-status-pill';
import { InboxAvatar } from '../support-conversation/components/inbox-avatar';
import { InboxIconButton } from '../support-conversation/components/inbox-icon-button';
import { InboxPill } from '../support-conversation/components/inbox-pill';
import { InboxSkeletonBar } from '../support-conversation/components/inbox-skeleton';
import {
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readAppTone,
  readTone,
} from '../support-conversation/components/inbox-tokens';
import { IssueRow } from '../support-conversation/components/linked-issues-section';
import {
  type PropertyRow,
  PropertyList,
} from '../support-conversation/components/property-list';
import { type SupportInboxConversation } from '../support-conversation/types/support-inbox';
import { formatRelativeTime } from '../support-conversation/utils/format-inbox-time.util';
import { readConversationName } from '../support-conversation/utils/read-conversation-name.util';
import {
  type MerchantFieldDisplay,
  readMerchantFieldDisplay,
} from '../utils/read-merchant-field-display.util';
import { MerchantCustomSettingsPanel } from './merchant-custom-settings-panel';

type IssueMerchantPreviewProps = {
  merchantId: string;
  issueId: string;
  fallbackName: string | null;
  onOpenConversation: (conversationId: string, label: string) => void;
  onOpenIssue: (issueId: string) => void;
};

const Section = ({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span
      style={{
        color: INBOX_TOKENS.textTertiary,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {title}
      {count !== undefined && count > 0 && ` · ${count}`}
    </span>
    {children}
  </section>
);

// The same frame PropertyList draws around Fields, so every section of the
// preview reads as one card.
const Card = ({
  children,
  padding,
}: {
  children: ReactNode;
  padding: number;
}) => (
  <div
    style={{
      background: INBOX_TOKENS.background,
      border: `1px solid ${INBOX_TOKENS.borderLight}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding,
    }}
  >
    {children}
  </div>
);

const CardRow = ({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) => (
  <div
    style={{
      borderTop: index === 0 ? 'none' : `1px solid ${INBOX_TOKENS.borderLight}`,
      padding: 4,
    }}
  >
    {children}
  </div>
);

const EmptyNote = ({ text }: { text: string }) => (
  <Card padding={12}>
    <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 12.5 }}>
      {text}
    </span>
  </Card>
);

const ConversationRow = ({
  conversation,
  onOpen,
}: {
  conversation: SupportInboxConversation;
  onOpen: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const name = readConversationName(conversation);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? INBOX_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: 10,
        color: INBOX_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'inherit',
        gap: 10,
        padding: '8px',
        textAlign: 'left',
        transition: 'background 120ms ease',
        width: '100%',
      }}
    >
      <InboxAvatar name={name} size={30} />
      <span
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 12.5,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <span
            style={{
              color: INBOX_TOKENS.textTertiary,
              flexShrink: 0,
              fontSize: 11,
            }}
          >
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </span>
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            minWidth: 0,
          }}
        >
          <ConversationStatusPill status={conversation.status} />
          <span
            style={{
              color: INBOX_TOKENS.textSecondary,
              flex: 1,
              fontSize: 12,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {conversation.lastMessageExcerpt ?? t('No messages yet')}
          </span>
        </span>
      </span>
    </button>
  );
};

const PreviewSkeleton = () => (
  <div
    role="status"
    aria-label={t('Loading merchant')}
    style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20 }}
  >
    <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
      <InboxSkeletonBar width={44} height={44} />
      <div
        style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8 }}
      >
        <InboxSkeletonBar width="60%" height={12} />
        <InboxSkeletonBar width="40%" height={9} />
      </div>
    </div>
    {[90, 70, 80].map((width, index) => (
      <InboxSkeletonBar key={index} width={`${width}%`} height={36} />
    ))}
  </div>
);

const readFieldIcon = (field: MerchantRecordField): ReactNode => {
  if (field.relatedLabel !== undefined || field.relatedCount !== undefined) {
    return <IconRelationManyToMany size={14} />;
  }

  switch (field.type) {
    case 'DATE':
    case 'DATE_TIME':
      return <IconCalendar size={14} />;
    case 'EMAILS':
      return <IconMail size={14} />;
    case 'BOOLEAN':
      return <IconCheckbox size={14} />;
    case 'ACTOR':
      return <IconUserCircle size={14} />;
    case 'PHONES':
      return <IconPhone size={14} />;
    case 'LINKS':
      return <IconWorldWww size={14} />;
    case 'SELECT':
    case 'MULTI_SELECT':
      return <IconTag size={14} />;
    case 'NUMBER':
    case 'NUMERIC':
    case 'CURRENCY':
    case 'RATING':
      return <IconNumber size={14} />;
    default:
      return <IconTextSize size={14} />;
  }
};

const FieldValue = ({
  display,
  onCopy,
}: {
  display: MerchantFieldDisplay;
  onCopy: (text: string) => void;
}) => {
  switch (display.kind) {
    case 'pills':
      return (
        <span
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'flex-end',
          }}
        >
          {display.items.map((item) => (
            <InboxPill key={item.label} tone={readTone(item.color)}>
              {item.label}
            </InboxPill>
          ))}
        </span>
      );
    case 'link':
      return (
        <a
          href={display.href}
          target="_blank"
          rel="noreferrer"
          style={{ color: INBOX_TOKENS.accent, overflowWrap: 'anywhere' }}
        >
          {display.text}
        </a>
      );
    case 'email':
      return (
        <span
          style={{
            alignItems: 'center',
            display: 'inline-flex',
            gap: 2,
            maxWidth: '100%',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {display.text}
          </span>
          <InboxIconButton
            label={t('Copy email')}
            onClick={() => onCopy(display.text)}
          >
            <IconCopy size={13} />
          </InboxIconButton>
        </span>
      );
    default:
      return <span style={{ overflowWrap: 'anywhere' }}>{display.text}</span>;
  }
};

const toRow = (
  field: MerchantRecordField,
  display: MerchantFieldDisplay | null,
  onCopy: (text: string) => void,
): PropertyRow => ({
  key: field.name,
  icon: readFieldIcon(field),
  label: field.label,
  value:
    display === null ? (
      <span style={{ color: INBOX_TOKENS.textLight }}>—</span>
    ) : (
      <FieldValue display={display} onCopy={onCopy} />
    ),
  hint:
    display !== null && 'hint' in display && display.hint !== undefined
      ? display.hint
      : undefined,
});

export const IssueMerchantPreview = ({
  merchantId,
  issueId,
  fallbackName,
  onOpenConversation,
  onOpenIssue,
}: IssueMerchantPreviewProps) => {
  const { issues, conversations, isLoading, error } =
    useMerchantPreview(merchantId);
  const recordFields = useMerchantRecordFields(merchantId);
  const [isShowingEmptyFields, setIsShowingEmptyFields] = useState(false);
  const { record } = recordFields;
  const domain =
    (typeof record?.name === 'string' && record.name.length > 0
      ? record.name
      : null) ?? fallbackName;
  const shopName = (domain ?? t('Merchant')).replace(/\.myshopify\.com$/, '');
  const appName =
    recordFields.fields.find((field) => field.name === 'app')?.relatedLabel ??
    null;
  const appTone = readAppTone(appName);
  const installedAt =
    typeof record?.installedAt === 'string' ? record.installedAt : null;
  const uninstalledAt =
    typeof record?.uninstalledAt === 'string' ? record.uninstalledAt : null;
  const isUninstalled =
    uninstalledAt !== null &&
    (installedAt === null || uninstalledAt >= installedAt);

  const copyEmail = (email: string) =>
    void copyToClipboard(email).then(() =>
      enqueueSnackbar({ message: t('Email copied'), variant: 'success' }),
    );

  if (isLoading || recordFields.isLoading) {
    return <PreviewSkeleton />;
  }

  const displayedFields = recordFields.fields.map((field) => ({
    field,
    display: readMerchantFieldDisplay(field),
  }));
  const filledRows = [
    ...displayedFields.filter(({ field }) => !field.isSystem),
    ...displayedFields.filter(({ field }) => field.isSystem),
  ]
    .filter(({ display }) => display !== null)
    .map(({ field, display }) => toRow(field, display, copyEmail));
  const emptyRows = displayedFields
    .filter(({ display }) => display === null)
    .map(({ field }) => toRow(field, null, copyEmail));
  const loadError = error ?? recordFields.error;

  return (
    <div
      style={{
        ...INBOX_THIN_SCROLLBAR_STYLE,
        color: INBOX_TOKENS.textPrimary,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        fontFamily: INBOX_TOKENS.fontFamily,
        gap: 22,
        minHeight: 0,
        overflowY: 'auto',
        padding: '16px 4px 24px',
      }}
    >
      <header style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <span
          style={{
            alignItems: 'center',
            background: appTone.background,
            borderRadius: 12,
            color: appTone.text,
            display: 'inline-flex',
            flexShrink: 0,
            height: 44,
            justifyContent: 'center',
            width: 44,
          }}
        >
          <IconShoppingBag size={22} />
        </span>
        <span
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 4,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 650,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shopName}
          </span>
          <span
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              minWidth: 0,
            }}
          >
            {appName !== null && (
              <InboxPill tone={appTone}>{appName}</InboxPill>
            )}
            {(installedAt !== null || uninstalledAt !== null) && (
              <InboxPill tone={readTone(isUninstalled ? 'red' : 'green')}>
                {isUninstalled ? t('Uninstalled') : t('Installed')}
              </InboxPill>
            )}
            {domain !== null && domain !== shopName && (
              <span
                style={{
                  color: INBOX_TOKENS.textTertiary,
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {domain}
              </span>
            )}
          </span>
        </span>
      </header>

      {loadError !== null && (
        <div
          role="alert"
          style={{
            background: 'rgba(220,38,38,0.08)',
            borderRadius: 10,
            color: INBOX_TOKENS.danger,
            fontSize: 12,
            padding: '8px 12px',
          }}
        >
          {loadError}
        </div>
      )}

      {(filledRows.length > 0 || emptyRows.length > 0) && (
        <Section title={t('Fields')}>
          {filledRows.length > 0 && <PropertyList rows={filledRows} />}
          {emptyRows.length > 0 && (
            <>
              {isShowingEmptyFields && <PropertyList rows={emptyRows} />}
              <button
                type="button"
                onClick={() => setIsShowingEmptyFields((isShown) => !isShown)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: 'none',
                  color: INBOX_TOKENS.textSecondary,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  padding: '2px 4px',
                }}
              >
                {isShowingEmptyFields
                  ? t('Hide empty fields')
                  : t('Show {count} empty fields', { count: emptyRows.length })}
              </button>
            </>
          )}
        </Section>
      )}

      {conversations !== null && (
        <Section title={t('Conversations')} count={conversations.length}>
          {conversations.length === 0 ? (
            <EmptyNote text={t('No conversations with this merchant yet.')} />
          ) : (
            <Card padding={0}>
              {conversations.map((conversation, index) => (
                <CardRow key={conversation.id} index={index}>
                  <ConversationRow
                    conversation={conversation}
                    onOpen={() =>
                      onOpenConversation(
                        conversation.id,
                        `${t('Conversation')}: ${readConversationName(conversation)}`,
                      )
                    }
                  />
                </CardRow>
              ))}
            </Card>
          )}
        </Section>
      )}

      <Section title={t('Issues')} count={issues.length}>
        {issues.length === 0 ? (
          <EmptyNote text={t('No issues linked to this merchant.')} />
        ) : (
          <Card padding={0}>
            {issues.map((issue, index) => (
              <CardRow key={issue.id} index={index}>
                <IssueRow
                  issue={issue}
                  onClick={() => onOpenIssue(issue.id)}
                  trailing={
                    issue.id === issueId ? (
                      <span
                        style={{
                          color: INBOX_TOKENS.textTertiary,
                          flexShrink: 0,
                          fontSize: 11,
                          paddingRight: 8,
                        }}
                      >
                        {t('This issue')}
                      </span>
                    ) : undefined
                  }
                />
              </CardRow>
            ))}
          </Card>
        )}
      </Section>

      <Section title={t('Custom settings')}>
        <Card padding={0}>
          <MerchantCustomSettingsPanel merchantId={merchantId} isDivided />
        </Card>
      </Section>
    </div>
  );
};
