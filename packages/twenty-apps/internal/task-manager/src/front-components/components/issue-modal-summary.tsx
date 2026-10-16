import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconExternalLink, IconPaperclip } from 'twenty-ui/icon';

import { useDevelopment } from '../hooks/use-development';
import {
  hasDevelopmentActivitySummary,
  summarizeDevelopmentActivity,
} from '../utils/summarize-development-activity.util';
import { DevelopmentSummaryChips } from './development-summary-chips';
import { TaskSidebarSection } from './issue-details-panel';
import { TASK_TOKENS } from './task-tokens';

type IssueModalSummaryProps = {
  issueId: string;
  attachmentCount: number;
  onOpenFullPage: () => void;
};

// The modal has no room for the Development and Attachments panels, so it
// says in one line each whether there is anything there, and a click opens
// the issue's own page where the panels live.
export const IssueModalSummary = ({
  issueId,
  attachmentCount,
  onOpenFullPage,
}: IssueModalSummaryProps) => {
  const { data, isLoading } = useDevelopment(issueId);
  const summary = summarizeDevelopmentActivity(data.links, data.deliveries);
  const hasDevelopment = !isLoading && hasDevelopmentActivitySummary(summary);

  if (!hasDevelopment && attachmentCount === 0) {
    return null;
  }

  const attachmentsRow =
    attachmentCount === 0 ? null : (
      <IssueModalSummaryRow
        label={t('Open issue page')}
        isBordered={false}
        onClick={onOpenFullPage}
      >
        <IconPaperclip size={14} color={TASK_TOKENS.textTertiary} />
        <span style={{ color: TASK_TOKENS.textPrimary }}>
          {attachmentCount === 1
            ? t('1 attachment')
            : t('{attachmentCount} attachments', { attachmentCount })}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}>
          {t('Open issue page')}
        </span>
      </IssueModalSummaryRow>
    );

  return (
    <TaskSidebarSection
      label={hasDevelopment ? t('Development') : t('Attachments')}
    >
      {hasDevelopment && (
        <IssueModalSummaryRow
          label={t('Open development on the issue page')}
          isBordered
          onClick={onOpenFullPage}
        >
          <DevelopmentSummaryChips summary={summary} />
          <span style={{ flex: 1 }} />
          <IconExternalLink size={13} color={TASK_TOKENS.textTertiary} />
        </IssueModalSummaryRow>
      )}
      {attachmentsRow}
    </TaskSidebarSection>
  );
};

type IssueModalSummaryRowProps = {
  label: string;
  isBordered: boolean;
  onClick: () => void;
  children: ReactNode;
};

const IssueModalSummaryRow = ({
  label,
  isBordered,
  onClick,
  children,
}: IssueModalSummaryRowProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered
          ? TASK_TOKENS.backgroundHover
          : isBordered
            ? TASK_TOKENS.background
            : 'transparent',
        border: isBordered ? `1px solid ${TASK_TOKENS.border}` : 'none',
        borderRadius: TASK_TOKENS.radius,
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        gap: 8,
        marginTop: isBordered ? 0 : 2,
        minHeight: 34,
        padding: '6px 8px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {children}
    </button>
  );
};
