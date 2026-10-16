import { createContext, type ReactNode, type SyntheticEvent } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconExternalLink, IconWorld } from 'twenty-ui/icon';

import { IssueTypeGlyph } from './task-board-card';
import { TASK_TOKENS } from './task-tokens';

export type LinkedIssueSummary = {
  id: string;
  issueKey?: string | null;
  title?: string | null;
  issueType?: string | null;
};

export type TaskRichTextLinkChips = {
  baseUrl: string | undefined;
  issuesById: ReadonlyMap<string, LinkedIssueSummary>;
};

// Set by a list that wants its links drawn as chips (the discussion); every
// other preview leaves it unset and keeps plain underlined links.
export const TaskRichTextLinkChipsContext =
  createContext<TaskRichTextLinkChips | null>(null);

const CHIP_TITLE_MAX_WIDTH = 240;

// A link's click must not also open the editor the preview sits in.
export const stopLinkEventPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

// Still a real link, so a click opens it the way any link in the preview
// does; only its face changes.
export const TaskRichTextLinkChip = ({
  href,
  chip,
}: {
  href: string;
  chip:
    | { kind: 'issue'; issue: LinkedIssueSummary; isComment: boolean }
    | { kind: 'external'; domain: string };
}) => {
  let content: ReactNode;
  let label: string;

  if (chip.kind === 'issue') {
    const { issue } = chip;

    // The parts are laid out with gaps, not spaces, so the name is spelled out.
    label = [
      issue.issueKey,
      issue.title ?? t('Untitled'),
      chip.isComment ? `› ${t('comment')}` : null,
    ]
      .filter((part) => typeof part === 'string' && part !== '')
      .join(' ');

    content = (
      <>
        <IssueTypeGlyph issueType={issue.issueType ?? null} size={13} />
        {typeof issue.issueKey === 'string' && issue.issueKey !== '' && (
          <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            {issue.issueKey}
          </span>
        )}
        <span
          style={{
            maxWidth: CHIP_TITLE_MAX_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.title ?? t('Untitled')}
        </span>
        {chip.isComment && (
          <span
            style={{ color: TASK_TOKENS.textTertiary, whiteSpace: 'nowrap' }}
          >
            {`› ${t('comment')}`}
          </span>
        )}
      </>
    );
  } else {
    label = chip.domain;
    content = (
      <>
        <IconWorld size={12} color={TASK_TOKENS.textTertiary} />
        <span
          style={{
            maxWidth: CHIP_TITLE_MAX_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {chip.domain}
        </span>
        <IconExternalLink size={11} color={TASK_TOKENS.textTertiary} />
      </>
    );
  }

  return (
    <a
      href={href}
      title={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={stopLinkEventPropagation}
      onClick={stopLinkEventPropagation}
      onKeyDown={stopLinkEventPropagation}
      style={{
        alignItems: 'center',
        background: TASK_TOKENS.backgroundSecondary,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        color: TASK_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'inline-flex',
        fontSize: 12.5,
        gap: 6,
        height: 22,
        maxWidth: '100%',
        padding: '0 8px',
        textDecoration: 'none',
        verticalAlign: 'middle',
      }}
    >
      {content}
    </a>
  );
};
