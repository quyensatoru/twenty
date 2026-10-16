import { type ReactNode } from 'react';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
} from 'twenty-sdk/front-component';
import {
  IconArrowUpRight,
  IconCalendar,
  IconClock,
  IconCopy,
  IconExternalLink,
  IconHeadphones,
  IconHourglassHigh,
  IconMessage,
  IconShoppingBag,
  IconWorld,
} from 'twenty-ui/icon';

import { buildCrispConversationUrl } from '../constants/crisp';
import {
  type SupportInboxConversation,
  type SupportInboxIssue,
} from '../types/support-inbox';
import {
  formatFriendlyDate,
  formatRelativeTime,
  formatWaitDuration,
} from '../utils/format-inbox-time.util';
import { readConversationName } from '../utils/read-conversation-name.util';
import { TaskAvatar } from '../../components/task-avatar';
import { InboxAvatar } from './inbox-avatar';
import { InboxButton } from './inbox-button';
import { InboxIconButton } from './inbox-icon-button';
import { InboxPill } from './inbox-pill';
import { AiSummaryCard } from './ai-summary-card';
import { LinkedIssuesSection } from './linked-issues-section';
import { PropertyList } from './property-list';
import { QuickAction } from './quick-action';
import { SessionDataSection } from './session-data-section';
import {
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readAppTone,
  readTone,
} from './inbox-tokens';

type CustomerDetailsPanelProps = {
  conversation: SupportInboxConversation;
  issues: SupportInboxIssue[];
  onIssuesChange: (issues: SupportInboxIssue[]) => void;
  onOpenMerchant: (merchantId: string, merchantName: string | null) => void;
  onOpenIssue: (issueId: string) => void;
  // Inside the issue's side column (340 to 480px): a denser layout with the
  // same content, sized like the issue's own property list beside it.
  isEmbedded?: boolean;
  // The issue the embedded panel is open from.
  currentIssueId?: string;
};

const EmbeddedSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <span
      style={{
        color: INBOX_TOKENS.textTertiary,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        lineHeight: '16px',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </span>
    {children}
  </section>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    </span>
    {children}
  </div>
);

export const CustomerDetailsPanel = ({
  conversation,
  issues,
  onIssuesChange,
  onOpenMerchant,
  onOpenIssue,
  isEmbedded = false,
  currentIssueId,
}: CustomerDetailsPanelProps) => {
  const name = readConversationName(conversation);
  const appTone = readAppTone(conversation.appName);
  const isWaiting =
    conversation.waitingSince !== null && conversation.status !== 'RESOLVED';

  const copyEmail = async (email: string) => {
    await copyToClipboard(email);
    await enqueueSnackbar({ message: t('Email copied'), variant: 'success' });
  };

  const crispUrl =
    conversation.websiteId === null || conversation.sessionId === null
      ? undefined
      : buildCrispConversationUrl({
          websiteId: conversation.websiteId,
          sessionId: conversation.sessionId,
        });
  const merchant = conversation.merchant;

  if (isEmbedded) {
    return (
      <aside
        aria-label={t('Customer details')}
        style={{
          ...INBOX_THIN_SCROLLBAR_STYLE,
          boxSizing: 'border-box',
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          fontSize: 13,
          gap: 18,
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px 16px 24px',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <TaskAvatar
            name={name}
            size={40}
            shouldShowTitle={false}
            initialCount={2}
          />
          <div
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
                fontSize: 14,
                fontWeight: 600,
                lineHeight: '20px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </span>
            {conversation.visitorEmail !== null && (
              <span
                style={{
                  alignItems: 'center',
                  color: INBOX_TOKENS.textSecondary,
                  display: 'flex',
                  fontSize: 12.5,
                  gap: 4,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conversation.visitorEmail}
                </span>
                <InboxIconButton
                  label={t('Copy email')}
                  size={20}
                  onClick={() => void copyEmail(conversation.visitorEmail ?? '')}
                >
                  <IconCopy size={12} />
                </InboxIconButton>
              </span>
            )}
            {(conversation.appName !== null ||
              conversation.country !== null) && (
              <span
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {conversation.appName !== null && (
                  <InboxPill tone={appTone}>{conversation.appName}</InboxPill>
                )}
                {conversation.country !== null && (
                  <InboxPill
                    tone={readTone('gray')}
                    icon={<IconWorld size={11} />}
                  >
                    {conversation.country}
                  </InboxPill>
                )}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <InboxButton
            size="small"
            href={crispUrl}
            isDisabled={crispUrl === undefined}
            icon={<IconExternalLink size={13} />}
          >
            {t('Open in Crisp')}
          </InboxButton>
          <InboxButton
            size="small"
            isDisabled={merchant === null}
            icon={<IconShoppingBag size={13} />}
            onClick={() =>
              merchant !== null && onOpenMerchant(merchant.id, merchant.name)
            }
          >
            {t('Merchant')}
          </InboxButton>
          <InboxButton
            size="small"
            isDisabled={conversation.visitorEmail === null}
            icon={<IconCopy size={13} />}
            onClick={() => void copyEmail(conversation.visitorEmail ?? '')}
          >
            {t('Copy email')}
          </InboxButton>
        </div>

        <AiSummaryCard
          key={conversation.id}
          conversation={conversation}
          isEmbedded
        />

        <EmbeddedSection title={t('Merchant')}>
          {merchant === null ? (
            <span
              style={{
                color: INBOX_TOKENS.textTertiary,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {conversation.shopDomain === null
                ? t(
                    'Not matched to a merchant yet. It links itself as soon as the chat carries the shop domain or a known email.',
                  )
                : t('{shop} is not a merchant in the CRM yet.', {
                    shop: conversation.shopDomain,
                  })}
            </span>
          ) : (
            <div
              style={{
                alignItems: 'center',
                border: `1px solid ${INBOX_TOKENS.border}`,
                borderRadius: 8,
                display: 'flex',
                gap: 10,
                padding: '8px 10px',
              }}
            >
              <span
                style={{
                  alignItems: 'center',
                  background: appTone.background,
                  borderRadius: 8,
                  color: appTone.text,
                  display: 'inline-flex',
                  flexShrink: 0,
                  height: 30,
                  justifyContent: 'center',
                  width: 30,
                }}
              >
                <IconShoppingBag size={15} />
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
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(merchant.name ?? '').replace(/\.myshopify\.com$/, '')}
                </span>
                <span
                  style={{
                    color: INBOX_TOKENS.textTertiary,
                    fontSize: 11.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {merchant.name}
                </span>
              </span>
              <InboxIconButton
                label={t('Open merchant')}
                onClick={() => onOpenMerchant(merchant.id, merchant.name)}
              >
                <IconArrowUpRight size={14} />
              </InboxIconButton>
            </div>
          )}
        </EmbeddedSection>

        <LinkedIssuesSection
          conversationId={conversation.id}
          appName={conversation.appName}
          issues={issues}
          onIssuesChange={onIssuesChange}
          onOpenIssue={onOpenIssue}
          isEmbedded
          currentIssueId={currentIssueId}
        />

        <EmbeddedSection title={t('Conversation')}>
          <PropertyList
            variant="plain"
            rows={[
              ...(isWaiting
                ? [
                    {
                      key: 'waiting',
                      label: t('Waiting'),
                      value: (
                        <span
                          style={{
                            color: INBOX_TOKENS.warning,
                            fontWeight: 500,
                          }}
                        >
                          {formatWaitDuration(conversation.waitingSince)}
                        </span>
                      ),
                      hint: t('since {time}', {
                        time: formatFriendlyDate(conversation.waitingSince),
                      }),
                    },
                  ]
                : []),
              {
                key: 'started',
                label: t('Started'),
                value: formatFriendlyDate(conversation.startedAt),
                hint: formatRelativeTime(conversation.startedAt),
              },
              {
                key: 'last-message',
                label: t('Last message'),
                value: formatFriendlyDate(conversation.lastMessageAt),
                hint: formatRelativeTime(conversation.lastMessageAt),
              },
              {
                key: 'messages',
                label: t('Messages'),
                value: (conversation.messageCount ?? 0).toLocaleString(),
              },
              {
                key: 'agent',
                label: t('Agent'),
                value: conversation.operatorName ?? '—',
              },
            ]}
          />
        </EmbeddedSection>

        {(conversation.segments ?? []).length > 0 && (
          <EmbeddedSection title={t('Segments')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(conversation.segments ?? []).map((segment) => (
                <InboxPill key={segment} tone={readTone('gray')}>
                  {segment}
                </InboxPill>
              ))}
            </div>
          </EmbeddedSection>
        )}

        {conversation.sessionData !== null &&
          Object.keys(conversation.sessionData).length > 0 && (
            <EmbeddedSection title={t('Session data')}>
              <SessionDataSection
                sessionData={conversation.sessionData}
                appName={conversation.appName}
                isEmbedded
              />
            </EmbeddedSection>
          )}
      </aside>
    );
  }

  return (
    <aside
      aria-label={t('Customer details')}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          ...INBOX_THIN_SCROLLBAR_STYLE,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 22,
          minHeight: 0,
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 4,
            textAlign: 'center',
          }}
        >
          <InboxAvatar name={name} size={64} ringColor={appTone.text} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 650,
              marginTop: 4,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          {conversation.visitorEmail !== null && (
            <span
              style={{
                alignItems: 'center',
                color: INBOX_TOKENS.textSecondary,
                display: 'flex',
                fontSize: 12.5,
                gap: 2,
                maxWidth: '100%',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {conversation.visitorEmail}
              </span>
              <InboxIconButton
                label={t('Copy email')}
                onClick={() => void copyEmail(conversation.visitorEmail ?? '')}
              >
                <IconCopy size={14} />
              </InboxIconButton>
            </span>
          )}
          <span
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              justifyContent: 'center',
            }}
          >
            {conversation.appName !== null && (
              <InboxPill tone={appTone} size="medium">
                {conversation.appName}
              </InboxPill>
            )}
            {conversation.country !== null && (
              <InboxPill
                tone={readTone('gray')}
                size="medium"
                icon={<IconWorld size={12} />}
              >
                {conversation.country}
              </InboxPill>
            )}
          </span>
          <span
            style={{
              display: 'flex',
              gap: 4,
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <QuickAction
              label={t('Crisp')}
              icon={<IconExternalLink size={16} />}
              href={
                conversation.websiteId === null ||
                conversation.sessionId === null
                  ? undefined
                  : buildCrispConversationUrl({
                      websiteId: conversation.websiteId,
                      sessionId: conversation.sessionId,
                    })
              }
              isDisabled={
                conversation.websiteId === null ||
                conversation.sessionId === null
              }
            />
            <QuickAction
              label={t('Merchant')}
              icon={<IconShoppingBag size={16} />}
              isDisabled={conversation.merchant === null}
              onClick={() =>
                conversation.merchant !== null &&
                onOpenMerchant(
                  conversation.merchant.id,
                  conversation.merchant.name,
                )
              }
            />
            <QuickAction
              label={t('Email')}
              icon={<IconCopy size={16} />}
              isDisabled={conversation.visitorEmail === null}
              onClick={() => void copyEmail(conversation.visitorEmail ?? '')}
            />
          </span>
        </div>

        <AiSummaryCard key={conversation.id} conversation={conversation} />

        <Section title={t('Merchant')}>
          {conversation.merchant === null ? (
            <div
              style={{
                background: INBOX_TOKENS.backgroundSecondary,
                border: `1px dashed ${INBOX_TOKENS.border}`,
                borderRadius: 12,
                color: INBOX_TOKENS.textTertiary,
                fontSize: 12.5,
                lineHeight: 1.5,
                padding: 12,
              }}
            >
              {conversation.shopDomain === null
                ? t(
                    'Not matched to a merchant yet. It links itself as soon as the chat carries the shop domain or a known email.',
                  )
                : t('{shop} is not a merchant in the CRM yet.', {
                    shop: conversation.shopDomain,
                  })}
            </div>
          ) : (
            <div
              style={{
                alignItems: 'center',
                background: INBOX_TOKENS.backgroundSecondary,
                border: `1px solid ${INBOX_TOKENS.border}`,
                borderRadius: 12,
                display: 'flex',
                gap: 10,
                padding: 12,
              }}
            >
              <span
                style={{
                  alignItems: 'center',
                  background: appTone.background,
                  borderRadius: 10,
                  color: appTone.text,
                  display: 'inline-flex',
                  flexShrink: 0,
                  height: 34,
                  justifyContent: 'center',
                  width: 34,
                }}
              >
                <IconShoppingBag size={18} />
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
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(conversation.merchant.name ?? '').replace(
                    /\.myshopify\.com$/,
                    '',
                  )}
                </span>
                <span
                  style={{
                    color: INBOX_TOKENS.textTertiary,
                    fontSize: 11.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conversation.merchant.name}
                </span>
              </span>
              <InboxIconButton
                label={t('Open merchant')}
                onClick={() =>
                  conversation.merchant !== null &&
                  onOpenMerchant(
                    conversation.merchant.id,
                    conversation.merchant.name,
                  )
                }
              >
                <IconArrowUpRight size={16} />
              </InboxIconButton>
            </div>
          )}
        </Section>

        <Section title={t('Issues')}>
          <LinkedIssuesSection
            conversationId={conversation.id}
            appName={conversation.appName}
            issues={issues}
            onIssuesChange={onIssuesChange}
            onOpenIssue={onOpenIssue}
          />
        </Section>

        <Section title={t('Conversation')}>
          <PropertyList
            rows={[
              ...(isWaiting
                ? [
                    {
                      key: 'waiting',
                      icon: <IconHourglassHigh size={14} />,
                      label: t('Waiting'),
                      value: (
                        <span style={{ color: INBOX_TOKENS.warning }}>
                          {formatWaitDuration(conversation.waitingSince)}
                        </span>
                      ),
                      hint: t('since {time}', {
                        time: formatFriendlyDate(conversation.waitingSince),
                      }),
                    },
                  ]
                : []),
              {
                key: 'started',
                icon: <IconCalendar size={14} />,
                label: t('Started'),
                value: formatFriendlyDate(conversation.startedAt),
                hint: formatRelativeTime(conversation.startedAt),
              },
              {
                key: 'last-message',
                icon: <IconClock size={14} />,
                label: t('Last message'),
                value: formatFriendlyDate(conversation.lastMessageAt),
                hint: formatRelativeTime(conversation.lastMessageAt),
              },
              {
                key: 'messages',
                icon: <IconMessage size={14} />,
                label: t('Messages'),
                value: (conversation.messageCount ?? 0).toLocaleString(),
              },
              {
                key: 'agent',
                icon: <IconHeadphones size={14} />,
                label: t('Agent'),
                value: conversation.operatorName ?? '—',
              },
            ]}
          />
        </Section>

        {(conversation.segments ?? []).length > 0 && (
          <Section title={t('Segments')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(conversation.segments ?? []).map((segment) => (
                <InboxPill key={segment} tone={readTone('gray')} size="medium">
                  {segment}
                </InboxPill>
              ))}
            </div>
          </Section>
        )}

        {conversation.sessionData !== null &&
          Object.keys(conversation.sessionData).length > 0 && (
            <Section title={t('Session data')}>
              <SessionDataSection
                sessionData={conversation.sessionData}
                appName={conversation.appName}
              />
            </Section>
          )}
      </div>
    </aside>
  );
};
