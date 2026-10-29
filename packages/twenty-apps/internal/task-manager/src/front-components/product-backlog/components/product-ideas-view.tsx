import { isNonEmptyString } from '@sniptt/guards';
import { useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconArrowRight,
  IconBlockquote,
  IconChevronUp,
  IconPlus,
  IconRestore,
  IconX,
} from 'twenty-ui/icon';

import {
  CREATE_IDEA_ROUTE_PATH,
  PROMOTE_IDEA_ROUTE_PATH,
  REQUEST_SOURCE_OPTIONS,
  STALE_ITEM_MONTHS,
  UPDATE_IDEA_ROUTE_PATH,
} from '../../../constants/product-backlog';
import { type Idea, type IdeaStatus } from '../../../types/product-backlog';
import { TaskBoardSelect } from '../../components/task-board-select';
import { TaskButton } from '../../components/task-button';
import {
  TaskDialogField,
  TaskDialogFrame,
} from '../../components/task-dialog-frame';
import { TaskTabs } from '../../components/task-tabs';
import { TaskTextInput } from '../../components/task-text-input';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import { type ProductViewProps } from '../types/product-view-props';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductEmpty,
  ProductTextArea,
} from './product-ui';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const reportError = (error: unknown) =>
  void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

const readSourceOption = (source: string | null | undefined) =>
  REQUEST_SOURCE_OPTIONS.find((option) => option.value === source);

// Requests and ideas before they earn a place in the backlog: who asked, how
// often, in their own words. Promoting one creates the backlog item.
export const ProductIdeasView = ({
  data,
  reload,
  inset,
  onOpenItem,
}: ProductViewProps) => {
  const [tab, setTab] = useState<IdeaStatus>('INBOX');
  const [isAdding, setIsAdding] = useState(false);
  // Clicks land at once and in order; the page re-read only confirms them.
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>(
    {},
  );
  // oxlint-disable-next-line twenty/no-state-useref
  const requestCountsRef = useRef<Record<string, number>>({});
  // oxlint-disable-next-line twenty/no-state-useref
  const countWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const readRequestCount = (idea: Idea) =>
    requestCounts[idea.id] ?? idea.requestCount ?? 1;
  const countOf = (status: IdeaStatus) =>
    data.ideas.filter((idea) => (idea.status ?? 'INBOX') === status).length;
  const ideas = data.ideas
    .filter((idea) => (idea.status ?? 'INBOX') === tab)
    .sort(
      (left, right) =>
        readRequestCount(right) - readRequestCount(left) ||
        (right.createdAt ?? '').localeCompare(left.createdAt ?? ''),
    );

  const updateIdea = async (ideaId: string, patch: Record<string, unknown>) => {
    try {
      await postAppRoute(UPDATE_IDEA_ROUTE_PATH, { ideaId, data: patch });
      await reload();
    } catch (error) {
      reportError(error);
    }
  };

  const changeRequestCount = (idea: Idea, delta: number) => {
    const current = requestCountsRef.current[idea.id] ?? idea.requestCount ?? 1;
    const next = Math.max(1, current + delta);

    if (next === current) {
      return;
    }

    requestCountsRef.current = { ...requestCountsRef.current, [idea.id]: next };
    setRequestCounts(requestCountsRef.current);
    countWriteQueueRef.current = countWriteQueueRef.current.then(async () => {
      try {
        await postAppRoute(UPDATE_IDEA_ROUTE_PATH, {
          ideaId: idea.id,
          data: { requestCount: next },
        });
      } catch (error) {
        const rest = Object.fromEntries(
          Object.entries(requestCountsRef.current).filter(
            ([ideaId]) => ideaId !== idea.id,
          ),
        );

        requestCountsRef.current = rest;
        setRequestCounts(rest);
        reportError(error);
      }
    });
  };

  const promoteIdea = async (ideaId: string) => {
    try {
      await postAppRoute(PROMOTE_IDEA_ROUTE_PATH, { ideaId });
      void enqueueSnackbar({
        message: t('Added to the backlog.'),
        variant: 'success',
      });
      await reload();
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
        overflowY: 'auto',
        padding: `12px ${inset.right}px 24px ${inset.left}px`,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <TaskTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'INBOX', label: t('Inbox'), count: countOf('INBOX') },
            {
              value: 'PROMOTED',
              label: t('In backlog'),
              count: countOf('PROMOTED'),
            },
            {
              value: 'REJECTED',
              label: t('Rejected'),
              count: countOf('REJECTED'),
            },
          ]}
        />
        <span style={{ flex: 1 }} />
        {data.canWrite && (
          <TaskButton
            variant="primary"
            size="compact"
            onClick={() => setIsAdding(true)}
          >
            <IconPlus size={14} />
            {t('Capture an idea')}
          </TaskButton>
        )}
      </div>

      {ideas.length === 0 ? (
        <ProductEmpty
          title={
            tab === 'INBOX' ? t('No ideas waiting') : t('Nothing here yet')
          }
          description={
            tab === 'INBOX'
              ? t(
                  'Capture requests from merchants, CS, sales or the team before they become backlog items.',
                )
              : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}
        >
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              canWrite={data.canWrite}
              promotedIssueKey={
                data.items.find((item) => item.id === idea.promotedIssueId)
                  ?.issueKey ?? null
              }
              requestCount={readRequestCount(idea)}
              onChangeRequestCount={(delta) => changeRequestCount(idea, delta)}
              onReject={() => void updateIdea(idea.id, { status: 'REJECTED' })}
              onRestore={() => void updateIdea(idea.id, { status: 'INBOX' })}
              onPromote={() => void promoteIdea(idea.id)}
              onOpenItem={onOpenItem}
            />
          ))}
        </div>
      )}

      {isAdding && data.activeProjectId !== null && (
        <twenty-overlay>
          <NewIdeaDialog
            projectId={data.activeProjectId}
            onClose={() => setIsAdding(false)}
            onCreated={() => {
              setIsAdding(false);
              setTab('INBOX');
              void reload();
            }}
          />
        </twenty-overlay>
      )}
    </div>
  );
};

type IdeaCardProps = {
  idea: Idea;
  canWrite: boolean;
  promotedIssueKey: string | null;
  requestCount: number;
  onChangeRequestCount: (delta: number) => void;
  onReject: () => void;
  onRestore: () => void;
  onPromote: () => void;
  onOpenItem: (issueId: string) => void;
};

const IDEA_CLAMP_STYLE = {
  display: '-webkit-box',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
  WebkitBoxOrient: 'vertical',
} as const;

// Rough character counts past which the clamped title or description is cut.
const IDEA_TITLE_CLAMP_LENGTH = 60;
const IDEA_DESCRIPTION_CLAMP_LENGTH = 130;

const IdeaCard = ({
  idea,
  canWrite,
  promotedIssueKey,
  requestCount,
  onChangeRequestCount,
  onReject,
  onRestore,
  onPromote,
  onOpenItem,
}: IdeaCardProps) => {
  const source = readSourceOption(idea.source);
  const sourceColor = readTagColor(source?.color ?? 'gray');
  const ageDays =
    typeof idea.createdAt === 'string'
      ? Math.round((Date.now() - Date.parse(idea.createdAt)) / DAY_IN_MS)
      : 0;
  const status = idea.status ?? 'INBOX';
  const canCount = canWrite && status === 'INBOX';
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand =
    (idea.title ?? '').length > IDEA_TITLE_CLAMP_LENGTH ||
    (idea.description ?? '').length > IDEA_DESCRIPTION_CLAMP_LENGTH;
  const metaParts = [
    isNonEmptyString(idea.requester) ? idea.requester : null,
    typeof idea.createdAt === 'string'
      ? new Date(idea.createdAt).toLocaleDateString()
      : null,
  ].filter((part) => part !== null);
  const footer =
    canWrite && status === 'INBOX' ? (
      <>
        <TaskButton size="small" variant="ghost" onClick={onReject}>
          <IconX size={14} />
          {t('Reject')}
        </TaskButton>
        <TaskButton size="small" variant="primary" onClick={onPromote}>
          <IconArrowRight size={14} />
          {t('Add to backlog')}
        </TaskButton>
      </>
    ) : status === 'PROMOTED' && typeof idea.promotedIssueId === 'string' ? (
      <TaskButton
        size="small"
        variant="ghost"
        onClick={() => onOpenItem(idea.promotedIssueId as string)}
      >
        <IconArrowRight size={14} />
        {promotedIssueKey ?? t('Open item')}
      </TaskButton>
    ) : canWrite && status === 'REJECTED' ? (
      <TaskButton size="small" variant="ghost" onClick={onRestore}>
        <IconRestore size={14} />
        {t('Restore')}
      </TaskButton>
    ) : null;

  return (
    <div
      style={{
        background: TASK_TOKENS.backgroundSecondary,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', flex: 1, gap: 12, padding: 12 }}>
        <button
          type="button"
          disabled={!canCount}
          title={canCount ? t('Left click: +1 · Right click: −1') : undefined}
          onClick={() => onChangeRequestCount(1)}
          onContextMenu={() => {
            if (canCount && requestCount > 1) {
              onChangeRequestCount(-1);
            }
          }}
          style={{
            alignItems: 'center',
            alignSelf: 'flex-start',
            background: TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radiusSmall,
            color: TASK_TOKENS.textPrimary,
            cursor: canCount ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            fontFamily: TASK_TOKENS.fontFamily,
            gap: 1,
            padding: '5px 0 6px',
            width: 48,
          }}
        >
          {canCount && (
            <span style={{ color: TASK_TOKENS.textTertiary, display: 'flex' }}>
              <IconChevronUp size={14} />
            </span>
          )}
          <span
            style={{
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              lineHeight: '18px',
            }}
          >
            {requestCount}
          </span>
          <span style={{ color: TASK_TOKENS.textTertiary, fontSize: 10 }}>
            {t('requests')}
          </span>
        </button>

        <div
          onClick={() => setIsExpanded((current) => !current)}
          style={{
            cursor: canExpand ? 'pointer' : 'default',
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              ...PRODUCT_TEXT_STYLE,
              ...(isExpanded ? {} : IDEA_CLAMP_STYLE),
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              WebkitLineClamp: isExpanded ? 'none' : 2,
            }}
          >
            {idea.title}
          </span>
          <span
            style={{
              ...PRODUCT_MUTED_STYLE,
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {source !== undefined && (
              <span
                style={{
                  background: sourceColor.background,
                  borderRadius: TASK_TOKENS.radiusExtraSmall,
                  color: sourceColor.text,
                  fontSize: 11,
                  padding: '1px 6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t(source.label)}
              </span>
            )}
            {metaParts.length > 0 && <span>{metaParts.join(' · ')}</span>}
            {ageDays > STALE_ITEM_MONTHS * 30 && (
              <span style={{ color: readTagColor('orange').text }}>
                {t('over 6 months old')}
              </span>
            )}
          </span>
          {isNonEmptyString(idea.description) && (
            <span
              style={{
                ...PRODUCT_TEXT_STYLE,
                ...(isExpanded ? {} : IDEA_CLAMP_STYLE),
                color: TASK_TOKENS.textSecondary,
                lineHeight: '19px',
                whiteSpace: 'pre-wrap',
                WebkitLineClamp: isExpanded ? 'none' : 3,
              }}
            >
              {idea.description}
            </span>
          )}
          {canExpand && (
            <span
              style={{
                ...PRODUCT_MUTED_STYLE,
                color: TASK_TOKENS.accent,
                fontWeight: 500,
              }}
            >
              {isExpanded ? t('Show less') : t('Show more')}
            </span>
          )}
          {isNonEmptyString(idea.quote) && (
            <span
              style={{
                ...PRODUCT_TEXT_STYLE,
                alignItems: 'flex-start',
                borderLeft: `2px solid ${TASK_TOKENS.borderStrong}`,
                color: TASK_TOKENS.textSecondary,
                display: 'flex',
                fontStyle: 'italic',
                gap: 6,
                paddingLeft: 8,
              }}
            >
              <IconBlockquote size={13} />
              {idea.quote}
            </span>
          )}
        </div>
      </div>

      {footer !== null && (
        <div
          style={{
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            gap: 6,
            justifyContent: 'flex-end',
            padding: '8px 12px',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

type NewIdeaDialogProps = {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
};

const NewIdeaDialog = ({
  projectId,
  onClose,
  onCreated,
}: NewIdeaDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<string>('PAYING_MERCHANT');
  const [requester, setRequester] = useState('');
  const [quote, setQuote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const create = async () => {
    setIsSaving(true);

    try {
      await postAppRoute(CREATE_IDEA_ROUTE_PATH, {
        projectId,
        data: { title: title.trim(), description, source, requester, quote },
      });
      onCreated();
    } catch (error) {
      reportError(error);
      setIsSaving(false);
    }
  };

  return (
    <TaskDialogFrame
      title={t('Capture an idea')}
      onClose={onClose}
      footer={
        <>
          <TaskButton variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </TaskButton>
          <TaskButton
            variant="primary"
            isDisabled={title.trim() === '' || isSaving}
            onClick={() => void create()}
          >
            {t('Add to inbox')}
          </TaskButton>
        </>
      }
    >
      <TaskDialogField label={t('Idea')}>
        <TaskTextInput
          ariaLabel={t('Idea')}
          value={title}
          onChange={setTitle}
          shouldAutoFocus
        />
      </TaskDialogField>
      <TaskDialogField label={t('Description')}>
        <ProductTextArea
          ariaLabel={t('Description')}
          value={description}
          onCommit={setDescription}
        />
      </TaskDialogField>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <TaskDialogField label={t('Source')}>
          <TaskBoardSelect
            ariaLabel={t('Source')}
            width={220}
            value={source}
            options={REQUEST_SOURCE_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.label),
              color: option.color,
            }))}
            onChange={setSource}
          />
        </TaskDialogField>
        <TaskDialogField label={t('Requested by')}>
          <TaskTextInput
            ariaLabel={t('Requested by')}
            value={requester}
            onChange={setRequester}
            width={220}
          />
        </TaskDialogField>
      </div>
      <TaskDialogField label={t('Customer quote')}>
        <TaskTextInput
          ariaLabel={t('Customer quote')}
          value={quote}
          onChange={setQuote}
          placeholder="“…”"
        />
      </TaskDialogField>
    </TaskDialogFrame>
  );
};
