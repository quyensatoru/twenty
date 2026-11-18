import { useState } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';

import { type ReleaseNotification } from '../../../types/release-notification';
import { TASK_TOKENS } from '../../components/task-tokens';
import { groupReleasesByMonth } from '../utils/group-releases-by-month.util';
import {
  formatReleaseDate,
  formatReleaseMonth,
} from '../utils/format-release-date.util';
import { readMarkdownExcerpt } from '../utils/read-markdown-excerpt.util';
import { ReleaseCategoryIcon } from './release-category-badge';
import { ReleaseStatusBadge } from './release-status-badge';

type ReleaseNotificationListProps = {
  releases: readonly ReleaseNotification[];
  selectedReleaseId: string | null;
  onSelect: (releaseId: string) => void;
  inlinePadding: number;
};

export const ReleaseNotificationList = ({
  releases,
  selectedReleaseId,
  onSelect,
  inlinePadding,
}: ReleaseNotificationListProps) => {
  const locale = useLocale();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {groupReleasesByMonth(releases).map((group) => (
        <section key={group.monthKey ?? 'unscheduled'}>
          <h3
            style={{
              background: TASK_TOKENS.background,
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              margin: 0,
              padding: `14px ${inlinePadding}px 6px`,
              position: 'sticky',
              textTransform: 'uppercase',
              top: 0,
              zIndex: 1,
            }}
          >
            {group.monthKey === null
              ? t('No release date')
              : formatReleaseMonth(group.monthKey, locale)}
            <span style={{ color: TASK_TOKENS.textLight, marginLeft: 6 }}>
              {group.releases.length}
            </span>
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: `0 ${inlinePadding - 8}px`,
            }}
          >
            {group.releases.map((release) => (
              <ReleaseNotificationRow
                key={release.id}
                release={release}
                isSelected={release.id === selectedReleaseId}
                onSelect={() => onSelect(release.id)}
                dateLabel={formatReleaseDate(release.releaseDate, locale)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const ReleaseNotificationRow = ({
  release,
  isSelected,
  onSelect,
  dateLabel,
}: {
  release: ReleaseNotification;
  isSelected: boolean;
  onSelect: () => void;
  dateLabel: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const excerpt = readMarkdownExcerpt(release.content?.markdown, 140);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isSelected}
      style={{
        alignItems: 'flex-start',
        background: isSelected
          ? TASK_TOKENS.backgroundSelected
          : isHovered
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
        border: 'none',
        borderRadius: TASK_TOKENS.radius,
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 12,
        padding: '10px 8px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <ReleaseCategoryIcon category={release.category} size={30} />
      <span
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 3,
          minWidth: 0,
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {release.title || t('Untitled release')}
        </span>
        <span
          style={{
            alignItems: 'center',
            color: TASK_TOKENS.textTertiary,
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: 12,
            gap: 8,
          }}
        >
          {release.version ? (
            <span
              style={{
                color: TASK_TOKENS.textSecondary,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 500,
              }}
            >
              {release.version}
            </span>
          ) : null}
          {dateLabel !== '' && <span>{dateLabel}</span>}
          <ReleaseStatusBadge status={release.status} />
        </span>
        {excerpt !== '' && (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              display: '-webkit-box',
              fontSize: 12,
              lineHeight: '17px',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {excerpt}
          </span>
        )}
      </span>
    </button>
  );
};
