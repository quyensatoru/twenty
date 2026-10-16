import { t } from 'twenty-sdk/front-component';
import {
  IconCalendar,
  IconCheck,
  IconExternalLink,
  IconMail,
  IconX,
} from 'twenty-ui/icon';

import {
  describeSessionData,
  type SessionEntry,
} from '../utils/describe-session-entry.util';
import {
  formatFriendlyDate,
  formatRelativeTime,
  toIsoString,
} from '../utils/format-inbox-time.util';
import { InboxPill } from './inbox-pill';
import { INBOX_TOKENS, readTone } from './inbox-tokens';
import { type PropertyRow, PropertyList } from './property-list';

type SessionDataSectionProps = {
  sessionData: Record<string, unknown> | null;
  appName: string | null;
  // In the issue's side column: one plain list, no tiles.
  isEmbedded?: boolean;
};

const readLabel = (entry: SessionEntry): string =>
  entry.isTranslatable ? t(entry.label) : entry.label;

const renderValue = (
  entry: SessionEntry,
): Omit<PropertyRow, 'key' | 'label'> => {
  switch (entry.kind) {
    case 'boolean':
      return {
        value: (
          <InboxPill
            tone={readTone(entry.value === true ? 'green' : 'gray')}
            icon={
              entry.value === true ? (
                <IconCheck size={11} />
              ) : (
                <IconX size={11} />
              )
            }
          >
            {entry.value === true ? t('Yes') : t('No')}
          </InboxPill>
        ),
      };
    case 'date': {
      const iso = toIsoString(entry.value as string | number);

      return {
        icon: <IconCalendar size={13} />,
        value: formatFriendlyDate(entry.value as string | number),
        hint: iso === null ? undefined : formatRelativeTime(iso),
      };
    }
    case 'email':
      return {
        icon: <IconMail size={13} />,
        value: (
          <a
            href={`mailto:${String(entry.value)}`}
            style={{ color: INBOX_TOKENS.accent, textDecoration: 'none' }}
          >
            {String(entry.value)}
          </a>
        ),
      };
    case 'url':
      return {
        value: (
          <a
            href={String(entry.value)}
            target="_blank"
            rel="noreferrer"
            style={{
              alignItems: 'center',
              color: INBOX_TOKENS.accent,
              display: 'inline-flex',
              gap: 4,
              textDecoration: 'none',
            }}
          >
            {String(entry.value).replace(/^https?:\/\//, '')}
            <IconExternalLink size={12} />
          </a>
        ),
      };
    case 'number':
      return { value: Number(entry.value).toLocaleString() };
    default:
      return { value: String(entry.value) };
  }
};

const HighlightTile = ({ entry }: { entry: SessionEntry }) => (
  <div
    style={{
      background: INBOX_TOKENS.backgroundSecondary,
      border: `1px solid ${INBOX_TOKENS.borderLight}`,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      padding: '10px 12px',
    }}
  >
    <span
      style={{
        color: INBOX_TOKENS.textTertiary,
        fontSize: 11,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {readLabel(entry)}
    </span>
    <span
      style={{
        fontSize: 14,
        fontWeight: 650,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={String(entry.value)}
    >
      {entry.kind === 'number'
        ? Number(entry.value).toLocaleString()
        : String(entry.value)}
    </span>
  </div>
);

// What the app told Crisp about the shop, made readable: the plan facts on
// top as tiles, everything else as named rows with typed values.
export const SessionDataSection = ({
  sessionData,
  appName,
  isEmbedded = false,
}: SessionDataSectionProps) => {
  const entries = describeSessionData(sessionData, appName);

  if (entries.length === 0) {
    return null;
  }

  if (isEmbedded) {
    return (
      <PropertyList
        variant="plain"
        rows={entries.map((entry) => ({
          key: entry.key,
          label: readLabel(entry),
          ...renderValue(entry),
        }))}
      />
    );
  }

  const highlights = entries.filter((entry) => entry.isHighlight);
  const rest = entries.filter((entry) => !entry.isHighlight);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {highlights.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {highlights.map((entry) => (
            <HighlightTile key={entry.key} entry={entry} />
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <PropertyList
          rows={rest.map((entry) => ({
            key: entry.key,
            label: readLabel(entry),
            ...renderValue(entry),
          }))}
        />
      )}
    </div>
  );
};
