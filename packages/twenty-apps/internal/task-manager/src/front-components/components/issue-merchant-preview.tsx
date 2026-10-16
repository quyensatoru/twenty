import { type ReactNode, useState } from 'react';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
} from 'twenty-sdk/front-component';
import {
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconShoppingBag,
} from 'twenty-ui/icon';

import { type MerchantRecordField } from '../hooks/use-merchant-record-fields';
import { useMerchantRecordFields } from '../hooks/use-merchant-record-fields';
import { useMerchantPreview } from '../hooks/use-merchant-preview';
import { ConversationStatusPill } from '../support-conversation/components/conversation-status-pill';
import { InboxAvatar } from '../support-conversation/components/inbox-avatar';
import { InboxPill } from '../support-conversation/components/inbox-pill';
import { InboxSkeletonBar } from '../support-conversation/components/inbox-skeleton';
import {
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readAppTone,
  readTone,
} from '../support-conversation/components/inbox-tokens';
import { IssueRow } from '../support-conversation/components/linked-issues-section';
import { type SupportInboxConversation } from '../support-conversation/types/support-inbox';
import { formatRelativeTime } from '../support-conversation/utils/format-inbox-time.util';
import { readConversationName } from '../support-conversation/utils/read-conversation-name.util';
import {
  type MerchantFieldDisplay,
  readMerchantFieldDisplay,
} from '../utils/read-merchant-field-display.util';
import { MerchantCustomSettingsPanel } from './merchant-custom-settings-panel';
import { TaskTabs } from './task-tabs';

type IssueMerchantPreviewProps = {
  merchantId: string;
  issueId: string;
  fallbackName: string | null;
  onOpenConversation: (conversationId: string, label: string) => void;
  onOpenIssue: (issueId: string) => void;
};

// A list sits on the panel itself, rows divided by a hairline, the way the
// issue sidebar lays out its own rows.
const Card = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      background: INBOX_TOKENS.background,
      display: 'flex',
      flexDirection: 'column',
      margin: '0 -4px',
      overflow: 'hidden',
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
  <span
    style={{
      color: INBOX_TOKENS.textTertiary,
      fontSize: 12.5,
      padding: '2px 0',
    }}
  >
    {text}
  </span>
);

// Matches the issue sidebar this drawer sits beside: same label column, same
// 13px type, one 20px line per row. Label and value share that line height, so
// the label stays level with the first line however tall the value grows.
// Relative, so the label keeps its share in both the 340 and the 480px column.
const FIELD_LABEL_WIDTH = 'clamp(88px, 32%, 140px)';
const FIELD_COLUMN_GAP = 12;
const FIELD_LINE_HEIGHT = '20px';

type FieldRow = {
  key: string;
  label: string;
  value: ReactNode;
  // Said in the same breath as the value ("Jul 2 · 105 days ago"), so it
  // follows it on the line rather than taking one of its own.
  inlineHint?: string;
  // A list that continues the value, such as further emails: under it.
  hint?: string;
};

const FieldList = ({ rows }: { rows: FieldRow[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {rows.map((row) => (
      <div
        key={row.key}
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          fontSize: 13,
          gap: FIELD_COLUMN_GAP,
          lineHeight: FIELD_LINE_HEIGHT,
          padding: '5px 0',
        }}
      >
        <span
          title={row.label}
          style={{
            color: INBOX_TOKENS.textTertiary,
            flexShrink: 0,
            overflowWrap: 'anywhere',
            width: FIELD_LABEL_WIDTH,
          }}
        >
          {row.label}
        </span>
        <span
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: INBOX_TOKENS.textPrimary,
              maxWidth: '100%',
              overflowWrap: 'anywhere',
            }}
          >
            {row.value}
            {row.inlineHint !== undefined && (
              <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 12 }}>
                {' · '}
                {row.inlineHint}
              </span>
            )}
          </span>
          {row.hint !== undefined && row.hint !== '' && (
            <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 12 }}>
              {row.hint}
            </span>
          )}
        </span>
      </div>
    ))}
  </div>
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
        borderRadius: 6,
        color: INBOX_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'inherit',
        gap: 10,
        padding: '8px 4px',
        textAlign: 'left',
        transition: 'background 120ms ease',
        width: '100%',
      }}
    >
      <InboxAvatar name={name} size={26} />
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

// The loaded preview's shape while it fetches: the identity block, the tab
// row and a few field rows, at the same padding and row height.
const PreviewSkeleton = () => (
  <div
    role="status"
    aria-label={t('Loading merchant')}
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '14px 16px 24px',
    }}
  >
    <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
      <InboxSkeletonBar width={36} height={36} />
      <div
        style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8 }}
      >
        <InboxSkeletonBar width="45%" height={14} />
        <div style={{ display: 'flex', gap: 6 }}>
          <InboxSkeletonBar width={64} height={18} />
          <InboxSkeletonBar width={56} height={18} />
          <InboxSkeletonBar width={140} height={10} />
        </div>
      </div>
    </div>
    <div
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${INBOX_TOKENS.border}`,
        display: 'flex',
        gap: 14,
        height: 32,
      }}
    >
      {[58, 44, 48, 52].map((width, index) => (
        <InboxSkeletonBar key={index} width={width} height={11} />
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[40, 62, 18, 36, 48].map((width, index) => (
        <div
          key={index}
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: FIELD_COLUMN_GAP,
            minHeight: 30,
          }}
        >
          <span style={{ flexShrink: 0, width: FIELD_LABEL_WIDTH }}>
            <InboxSkeletonBar width={[80, 40, 96, 32, 70][index]} height={10} />
          </span>
          <InboxSkeletonBar width={`${width}%`} height={11} />
        </div>
      ))}
    </div>
  </div>
);

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
        // One line, cut with an ellipsis (the full address is on hover):
        // wrapped mid-address it read as two values.
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 4,
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <span
            title={display.text}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {display.text}
          </span>
          <CopyButton
            label={t('Copy email')}
            onClick={() => onCopy(display.text)}
          />
        </span>
      );
    default:
      return <span style={{ overflowWrap: 'anywhere' }}>{display.text}</span>;
  }
};

// Sized to the 20px text line, so a row with an email is no taller than its
// neighbours: the inbox's 32px icon button pushed the value off its label.
const CopyButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? INBOX_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: 4,
        color: isHovered
          ? INBOX_TOKENS.textSecondary
          : INBOX_TOKENS.textTertiary,
        cursor: 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 20,
        justifyContent: 'center',
        padding: 0,
        width: 20,
      }}
    >
      <IconCopy size={13} />
    </button>
  );
};

const toRow = (
  field: MerchantRecordField,
  display: MerchantFieldDisplay | null,
  onCopy: (text: string) => void,
): FieldRow => {
  const hint =
    display !== null && 'hint' in display && display.hint !== undefined
      ? display.hint
      : undefined;

  return {
    key: field.name,
    label: field.label,
    value:
      display === null ? (
        <span style={{ color: INBOX_TOKENS.textLight }}>—</span>
      ) : (
        <FieldValue display={display} onCopy={onCopy} />
      ),
    ...(display?.kind === 'email' ? { hint } : { inlineHint: hint }),
  };
};

// The four bookkeeping fields fold into two lines, when and by whom, under the
// merchant's own fields: as four rows they outweighed what the merchant is.
const RECORD_INFO_PAIRS = [
  { label: () => t('Created'), at: 'createdAt', by: 'createdBy' },
  { label: () => t('Last updated'), at: 'updatedAt', by: 'updatedBy' },
] as const;

const readText = (display: MerchantFieldDisplay | null): string | null =>
  display === null || !('text' in display) ? null : display.text;

const buildRecordInfoRows = (
  displays: {
    field: MerchantRecordField;
    display: MerchantFieldDisplay | null;
  }[],
): FieldRow[] =>
  RECORD_INFO_PAIRS.flatMap((pair) => {
    const at = displays.find(({ field }) => field.name === pair.at)?.display;
    const by = displays.find(({ field }) => field.name === pair.by)?.display;
    const when =
      at !== undefined && at !== null && 'hint' in at && at.hint !== undefined
        ? at.hint
        : readText(at ?? null);
    const who = readText(by ?? null);

    if (when === null && who === null) {
      return [];
    }

    return [
      {
        key: pair.at,
        label: pair.label(),
        value: (
          <span
            title={readText(at ?? null) ?? undefined}
            style={{ color: INBOX_TOKENS.textSecondary }}
          >
            {[when, who === null ? null : t('by {name}', { name: who })]
              .filter((part): part is string => part !== null)
              .join(' ')}
          </span>
        ),
      },
    ];
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'chats' | 'issues' | 'settings'
  >('overview');
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
  const isRecordInfo = (field: MerchantRecordField) =>
    RECORD_INFO_PAIRS.some(
      (pair) => pair.at === field.name || pair.by === field.name,
    );
  const ownFields = displayedFields.filter(({ field }) => !isRecordInfo(field));
  const filledRows = [
    ...ownFields.filter(({ field }) => !field.isSystem),
    ...ownFields.filter(({ field }) => field.isSystem),
  ]
    .filter(({ display }) => display !== null)
    .map(({ field, display }) => toRow(field, display, copyEmail));
  const emptyRows = ownFields
    .filter(({ display }) => display === null)
    .map(({ field }) => toRow(field, null, copyEmail));
  const recordInfoRows = buildRecordInfoRows(displayedFields);
  const loadError = error ?? recordFields.error;

  const tabs = [
    { value: 'overview' as const, label: t('Overview') },
    {
      value: 'chats' as const,
      label: t('Chats'),
      count: conversations?.length ?? 0,
    },
    { value: 'issues' as const, label: t('Issues'), count: issues.length },
    { value: 'settings' as const, label: t('Settings') },
  ];

  return (
    <div
      style={{
        ...INBOX_THIN_SCROLLBAR_STYLE,
        boxSizing: 'border-box',
        color: INBOX_TOKENS.textPrimary,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        fontFamily: INBOX_TOKENS.fontFamily,
        fontSize: 13,
        gap: 14,
        minHeight: 0,
        overflowY: 'auto',
        padding: '14px 16px 24px',
      }}
    >
      <header style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
        <span
          style={{
            alignItems: 'center',
            background: appTone.background,
            borderRadius: 8,
            color: appTone.text,
            display: 'inline-flex',
            flexShrink: 0,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          <IconShoppingBag size={18} />
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
              fontSize: 15,
              fontWeight: 600,
              lineHeight: '20px',
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
                  minWidth: 0,
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

      {/* Tabs rather than five stacked sections: in a 340 to 480px column the
          settings form sat four screens down. */}
      <TaskTabs
        variant="underline"
        isCompact
        value={activeTab}
        tabs={tabs}
        onChange={setActiveTab}
      />

      {loadError !== null && (
        <div
          role="alert"
          style={{
            background: 'rgba(220,38,38,0.08)',
            borderRadius: 8,
            color: INBOX_TOKENS.danger,
            fontSize: 12,
            padding: '8px 12px',
          }}
        >
          {loadError}
        </div>
      )}

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filledRows.length > 0 && <FieldList rows={filledRows} />}
          {emptyRows.length > 0 && (
            <>
              {isShowingEmptyFields && <FieldList rows={emptyRows} />}
              <button
                type="button"
                onClick={() => setIsShowingEmptyFields((isShown) => !isShown)}
                style={{
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: 'none',
                  color: INBOX_TOKENS.textTertiary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  gap: 4,
                  // Under the values, where the rows it reveals will start.
                  marginLeft: `calc(${FIELD_LABEL_WIDTH} + ${FIELD_COLUMN_GAP}px)`,
                  marginTop: 4,
                  padding: '4px 0',
                }}
              >
                {isShowingEmptyFields ? (
                  <IconChevronUp size={11} />
                ) : (
                  <IconChevronDown size={11} />
                )}
                {isShowingEmptyFields
                  ? t('Hide empty fields')
                  : t('Show {count} empty fields', { count: emptyRows.length })}
              </button>
            </>
          )}
          {recordInfoRows.length > 0 && (
            <div
              style={{
                borderTop: `1px solid ${INBOX_TOKENS.borderLight}`,
                marginTop: 8,
                paddingTop: 5,
              }}
            >
              <FieldList rows={recordInfoRows} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'chats' &&
        (conversations === null || conversations.length === 0 ? (
          <EmptyNote text={t('No conversations with this merchant yet.')} />
        ) : (
          <Card>
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
        ))}

      {activeTab === 'issues' &&
        (issues.length === 0 ? (
          <EmptyNote text={t('No issues linked to this merchant.')} />
        ) : (
          <Card>
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
                          fontSize: 11.5,
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
        ))}

      {activeTab === 'settings' && (
        <MerchantCustomSettingsPanel
          merchantId={merchantId}
          compactLabelWidth={FIELD_LABEL_WIDTH}
        />
      )}
    </div>
  );
};
