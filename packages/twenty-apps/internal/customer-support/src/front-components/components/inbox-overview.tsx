import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconCheck,
  IconHourglassHigh,
  IconMessageCircle,
  IconPlug,
  IconRefresh,
} from 'twenty-ui/icon';

import {
  type SupportInboxCounts,
  type SupportInboxSyncState,
  type SupportInboxTab,
} from '../../types/support-inbox';
import { formatRelativeTime } from '../utils/format-inbox-time.util';
import { InboxButton } from './inbox-button';
import { InboxSkeletonBar } from './inbox-skeleton';
import {
  INBOX_CARD_STYLE,
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readTone,
} from './inbox-tokens';

type InboxOverviewProps = {
  counts: SupportInboxCounts | null;
  sync: SupportInboxSyncState | null;
  isSyncing: boolean;
  onOpenTab: (tab: SupportInboxTab) => void;
  onSync: () => void;
  onImportHistory: () => void;
};

type StatCardProps = {
  label: string;
  hint: string;
  value: number | undefined;
  color: string;
  icon: ReactNode;
  onClick: () => void;
};

const StatCard = ({
  label,
  hint,
  value,
  color,
  icon,
  onClick,
}: StatCardProps) => {
  const tone = readTone(color);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: INBOX_TOKENS.background,
        border: `1px solid ${isHovered ? INBOX_TOKENS.borderStrong : INBOX_TOKENS.border}`,
        borderRadius: 14,
        boxShadow: isHovered ? INBOX_TOKENS.shadowRaised : INBOX_TOKENS.shadow,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition:
          'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, border-color 220ms ease',
        color: INBOX_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
        gap: 10,
        padding: 16,
        textAlign: 'left',
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <span
          style={{
            alignItems: 'center',
            background: tone.background,
            borderRadius: 9,
            color: tone.text,
            display: 'inline-flex',
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            color: INBOX_TOKENS.textSecondary,
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </span>
      <span
        style={{
          fontSize: 30,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 650,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value === undefined ? (
          <InboxSkeletonBar width={48} height={26} />
        ) : (
          value
        )}
      </span>
      <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 11.5 }}>
        {hint}
      </span>
    </button>
  );
};

const SetupCard = ({
  onSync,
  isSyncing,
}: {
  onSync: () => void;
  isSyncing: boolean;
}) => (
  <div
    style={{
      background: INBOX_TOKENS.background,
      border: `1px solid ${INBOX_TOKENS.border}`,
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 20,
    }}
  >
    <span style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
      <span
        style={{
          alignItems: 'center',
          background: readTone('purple').background,
          borderRadius: 10,
          color: readTone('purple').text,
          display: 'inline-flex',
          height: 32,
          justifyContent: 'center',
          width: 32,
        }}
      >
        <IconPlug size={18} />
      </span>
      <span style={{ fontSize: 15, fontWeight: 650 }}>
        {t('Connect Crisp')}
      </span>
    </span>
    <ol
      style={{
        color: INBOX_TOKENS.textSecondary,
        display: 'flex',
        flexDirection: 'column',
        fontSize: 13,
        gap: 6,
        lineHeight: 1.5,
        margin: 0,
        paddingLeft: 18,
      }}
    >
      <li>
        {t(
          'Settings > Apps > Customer Support > Variables: fill the Crisp plugin token, the web hook secret and one website id per app.',
        )}
      </li>
      <li>
        {t(
          'Come back here and press Sync now to link the websites and import recent chats.',
        )}
      </li>
      <li>
        {t(
          'Point the plugin web hook at this workspace so new messages arrive live.',
        )}
      </li>
    </ol>
    <span>
      <InboxButton
        variant="primary"
        onClick={onSync}
        isDisabled={isSyncing}
        icon={<IconRefresh size={15} />}
      >
        {isSyncing ? t('Syncing…') : t('Sync now')}
      </InboxButton>
    </span>
  </div>
);

export const InboxOverview = ({
  counts,
  sync,
  isSyncing,
  onOpenTab,
  onSync,
  onImportHistory,
}: InboxOverviewProps) => {
  return (
    <section
      aria-label={t('Inbox overview')}
      style={{
        ...INBOX_CARD_STYLE,
        background: INBOX_TOKENS.backgroundSecondary,
        flex: 1,
      }}
    >
      <div
        style={{
          ...INBOX_THIN_SCROLLBAR_STYLE,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 24,
          margin: '0 auto',
          maxWidth: 760,
          minHeight: 0,
          overflowY: 'auto',
          padding: '32px 28px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' }}
          >
            {t('Inbox overview')}
          </span>
          <span style={{ color: INBOX_TOKENS.textSecondary, fontSize: 13.5 }}>
            {t(
              'Every Crisp chat, next to the merchant it belongs to. Pick a conversation to read it.',
            )}
          </span>
        </div>

        {sync !== null && !sync.isConfigured ? (
          <SetupCard onSync={onSync} isSyncing={isSyncing} />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              }}
            >
              <StatCard
                label={t('Needs reply')}
                hint={t('Customers waiting on us')}
                value={counts?.waiting}
                color="orange"
                icon={<IconHourglassHigh size={16} />}
                onClick={() => onOpenTab('waiting')}
              />
              <StatCard
                label={t('Open')}
                hint={t('Not resolved yet')}
                value={counts?.open}
                color="blue"
                icon={<IconMessageCircle size={16} />}
                onClick={() => onOpenTab('open')}
              />
              <StatCard
                label={t('Resolved')}
                hint={t('Closed in Crisp')}
                value={counts?.resolved}
                color="green"
                icon={<IconCheck size={16} />}
                onClick={() => onOpenTab('resolved')}
              />
            </div>

            <div
              style={{
                alignItems: 'center',
                color: INBOX_TOKENS.textTertiary,
                display: 'flex',
                flexWrap: 'wrap',
                fontSize: 12.5,
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              <span style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
                {sync?.lastError !== null && sync?.lastError !== undefined ? (
                  <>
                    <IconAlertTriangle size={14} color={INBOX_TOKENS.danger} />
                    <span style={{ color: INBOX_TOKENS.danger }}>
                      {sync.lastError}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        background: INBOX_TOKENS.success,
                        borderRadius: 999,
                        height: 7,
                        width: 7,
                      }}
                    />
                    {sync?.lastSyncedAt === null || sync === null
                      ? t('Waiting for the first sync')
                      : t('Last catch-up {time}', {
                          time: formatRelativeTime(sync.lastSyncedAt),
                        })}
                  </>
                )}
              </span>
              <InboxButton
                onClick={onImportHistory}
                isDisabled={isSyncing}
                icon={<IconRefresh size={15} />}
              >
                {t('Import last 30 days')}
              </InboxButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
