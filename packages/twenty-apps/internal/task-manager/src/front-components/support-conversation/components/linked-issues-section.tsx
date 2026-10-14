import { type ReactNode, useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconLink, IconPlus, IconSearch, IconX } from 'twenty-ui/icon';

import {
  SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH,
  SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH,
} from '../constants/crisp';
import {
  type SupportInboxIssue,
  type SupportInboxLinkIssueResult,
  type SupportInboxSearchIssuesResult,
} from '../types/support-inbox';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import { InboxIconButton } from './inbox-icon-button';
import { InboxPill } from './inbox-pill';
import { INBOX_TOKENS, readTone } from './inbox-tokens';

type LinkedIssuesSectionProps = {
  conversationId: string;
  appName: string | null;
  issues: SupportInboxIssue[];
  onIssuesChange: (issues: SupportInboxIssue[]) => void;
  onOpenIssue: (issueId: string) => void;
};

const SEARCH_DELAY_MS = 250;

export const IssueRow = ({
  issue,
  trailing,
  onClick,
}: {
  issue: SupportInboxIssue;
  trailing?: ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? INBOX_TOKENS.backgroundHover : 'transparent',
        borderRadius: 10,
        display: 'flex',
        gap: 4,
        transition: 'background 120ms ease',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        title={issue.title ?? undefined}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: INBOX_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          flex: 1,
          fontFamily: 'inherit',
          gap: 8,
          minWidth: 0,
          padding: '7px 8px',
          textAlign: 'left',
        }}
      >
        {issue.issueKey !== null && (
          <span
            style={{
              color: INBOX_TOKENS.textTertiary,
              flexShrink: 0,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
            }}
          >
            {issue.issueKey}
          </span>
        )}
        <span
          style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: 500,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.title ?? t('Untitled issue')}
        </span>
        {issue.statusName !== null && (
          <InboxPill tone={readTone(issue.statusColor ?? 'gray')}>
            {issue.statusName}
          </InboxPill>
        )}
      </button>
      {trailing}
    </div>
  );
};

export const LinkedIssuesSection = ({
  conversationId,
  appName,
  issues,
  onIssuesChange,
  onOpenIssue,
}: LinkedIssuesSectionProps) => {
  const [isPicking, setIsPicking] = useState(false);
  const [results, setResults] = useState<SupportInboxIssue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [busyIssueId, setBusyIssueId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGeneration = useRef(0);
  const linkedIds = new Set(issues.map((issue) => issue.id));

  const search = async (value: string) => {
    const generation = ++searchGeneration.current;

    setIsSearching(true);

    try {
      const result = await postAppRoute<SupportInboxSearchIssuesResult>(
        SUPPORT_INBOX_SEARCH_ISSUES_ROUTE_PATH,
        { search: value, appName },
      );

      if (generation === searchGeneration.current) {
        setResults(result.issues);
      }
    } catch (error) {
      if (generation === searchGeneration.current) {
        setResults([]);
        await enqueueSnackbar({
          message: readErrorText(error),
          variant: 'error',
        });
      }
    } finally {
      if (generation === searchGeneration.current) {
        setIsSearching(false);
      }
    }
  };

  const scheduleSearch = (value: string) => {
    if (searchTimer.current !== null) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      void search(value.trim());
    }, SEARCH_DELAY_MS);
  };

  const openPicker = () => {
    setIsPicking(true);
    void search('');
  };

  const closePicker = () => {
    setIsPicking(false);
    setResults([]);
    searchGeneration.current++;
  };

  const setLinked = async (issueId: string, isLinked: boolean) => {
    setBusyIssueId(issueId);

    try {
      const result = await postAppRoute<SupportInboxLinkIssueResult>(
        SUPPORT_INBOX_LINK_ISSUE_ROUTE_PATH,
        { conversationId, issueId, isLinked },
      );

      onIssuesChange(result.issues);

      if (isLinked) {
        closePicker();
      }
    } catch (error) {
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    } finally {
      setBusyIssueId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {issues.length === 0 && !isPicking && (
        <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 12.5 }}>
          {t(
            'No issue linked yet. Link one so the team can follow it from the issue too.',
          )}
        </span>
      )}
      {issues.map((issue) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          onClick={() => onOpenIssue(issue.id)}
          trailing={
            <InboxIconButton
              label={t('Unlink issue')}
              isDisabled={busyIssueId === issue.id}
              onClick={() => void setLinked(issue.id, false)}
            >
              <IconX size={14} />
            </InboxIconButton>
          }
        />
      ))}
      {isPicking ? (
        <div
          style={{
            background: INBOX_TOKENS.background,
            border: `1px solid ${INBOX_TOKENS.border}`,
            borderRadius: 12,
            boxShadow: INBOX_TOKENS.shadowRaised,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              borderBottom: `1px solid ${INBOX_TOKENS.borderLight}`,
              display: 'flex',
              gap: 8,
              padding: '6px 6px 6px 10px',
            }}
          >
            <IconSearch size={14} color={INBOX_TOKENS.textTertiary} />
            <input
              ref={(element) => element?.focus()}
              aria-label={t('Search issues')}
              placeholder={t('Search issue title or key…')}
              onChange={(event) => scheduleSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  closePicker();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: INBOX_TOKENS.textPrimary,
                flex: 1,
                fontFamily: 'inherit',
                fontSize: 12.5,
                minWidth: 0,
                outline: 'none',
              }}
            />
            <InboxIconButton label={t('Close')} onClick={closePicker}>
              <IconX size={14} />
            </InboxIconButton>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 240,
              overflowY: 'auto',
              padding: 4,
            }}
          >
            {isSearching && results.length === 0 ? (
              <span
                style={{
                  color: INBOX_TOKENS.textTertiary,
                  fontSize: 12,
                  padding: '8px 10px',
                }}
              >
                {t('Searching…')}
              </span>
            ) : results.length === 0 ? (
              <span
                style={{
                  color: INBOX_TOKENS.textTertiary,
                  fontSize: 12,
                  padding: '8px 10px',
                }}
              >
                {t('No matching issue.')}
              </span>
            ) : (
              results.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  onClick={() => {
                    if (!linkedIds.has(issue.id) && busyIssueId === null) {
                      void setLinked(issue.id, true);
                    }
                  }}
                  trailing={
                    linkedIds.has(issue.id) ? (
                      <span
                        style={{
                          color: INBOX_TOKENS.textTertiary,
                          fontSize: 11,
                          paddingRight: 8,
                        }}
                      >
                        {t('Linked')}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: INBOX_TOKENS.accent,
                          display: 'inline-flex',
                          paddingRight: 8,
                        }}
                      >
                        <IconLink size={14} />
                      </span>
                    )
                  }
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          style={{
            alignItems: 'center',
            alignSelf: 'flex-start',
            background: 'transparent',
            border: `1px dashed ${INBOX_TOKENS.borderStrong}`,
            borderRadius: 999,
            color: INBOX_TOKENS.textSecondary,
            cursor: 'pointer',
            display: 'inline-flex',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 500,
            gap: 4,
            height: 28,
            padding: '0 12px',
          }}
        >
          <IconPlus size={13} />
          {t('Link issue')}
        </button>
      )}
    </div>
  );
};
