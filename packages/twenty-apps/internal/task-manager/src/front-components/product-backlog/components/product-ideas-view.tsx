import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconArrowRight,
  IconBlockquote,
  IconInbox,
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
  const countOf = (status: IdeaStatus) =>
    data.ideas.filter((idea) => (idea.status ?? 'INBOX') === status).length;
  const ideas = data.ideas
    .filter((idea) => (idea.status ?? 'INBOX') === tab)
    .sort(
      (left, right) =>
        (right.requestCount ?? 1) - (left.requestCount ?? 1) ||
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
              onPlusOne={() =>
                void updateIdea(idea.id, {
                  requestCount: (idea.requestCount ?? 1) + 1,
                })
              }
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
  onPlusOne: () => void;
  onReject: () => void;
  onRestore: () => void;
  onPromote: () => void;
  onOpenItem: (issueId: string) => void;
};

const IdeaCard = ({
  idea,
  canWrite,
  promotedIssueKey,
  onPlusOne,
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

  return (
    <div
      style={{
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 12,
      }}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 8 }}>
        <span
          style={{
            color: readTagColor('yellow').text,
            display: 'inline-flex',
            paddingTop: 2,
          }}
        >
          <IconInbox size={15} />
        </span>
        <strong style={{ ...PRODUCT_TEXT_STYLE, flex: 1 }}>{idea.title}</strong>
        {source !== undefined && (
          <span
            style={{
              background: sourceColor.background,
              borderRadius: TASK_TOKENS.radiusExtraSmall,
              color: sourceColor.text,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              padding: '1px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {t(source.label)}
          </span>
        )}
        <button
          type="button"
          disabled={!canWrite || status !== 'INBOX'}
          title={t('Asked for again: +1')}
          onClick={onPlusOne}
          style={{
            ...PRODUCT_MUTED_STYLE,
            background: TASK_TOKENS.backgroundTertiary,
            border: 'none',
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            cursor: canWrite && status === 'INBOX' ? 'pointer' : 'default',
            fontWeight: 600,
            padding: '1px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          ×{idea.requestCount ?? 1}
          {canWrite && status === 'INBOX' ? ' +1' : ''}
        </button>
      </div>
      {typeof idea.description === 'string' && idea.description !== '' && (
        <span
          style={{ ...PRODUCT_TEXT_STYLE, color: TASK_TOKENS.textSecondary }}
        >
          {idea.description}
        </span>
      )}
      {typeof idea.quote === 'string' && idea.quote !== '' && (
        <span
          style={{
            ...PRODUCT_TEXT_STYLE,
            alignItems: 'flex-start',
            borderLeft: `2px solid ${TASK_TOKENS.borderStrong}`,
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
      <span style={PRODUCT_MUTED_STYLE}>
        {[
          idea.requester === null ||
          idea.requester === undefined ||
          idea.requester === ''
            ? '—'
            : idea.requester,
          typeof idea.createdAt === 'string'
            ? new Date(idea.createdAt).toLocaleDateString()
            : null,
          ageDays > STALE_ITEM_MONTHS * 30 ? t('over 6 months old') : null,
        ]
          .filter((part) => part !== null)
          .join(' · ')}
      </span>
      {canWrite && status === 'INBOX' && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <TaskButton size="small" variant="ghost" onClick={onReject}>
            <IconX size={14} />
            {t('Reject')}
          </TaskButton>
          <TaskButton size="small" variant="primary" onClick={onPromote}>
            <IconArrowRight size={14} />
            {t('Add to backlog')}
          </TaskButton>
        </div>
      )}
      {status === 'PROMOTED' && typeof idea.promotedIssueId === 'string' && (
        <div>
          <TaskButton
            size="small"
            variant="ghost"
            onClick={() => onOpenItem(idea.promotedIssueId as string)}
          >
            <IconArrowRight size={14} />
            {promotedIssueKey ?? t('Open item')}
          </TaskButton>
        </div>
      )}
      {canWrite && status === 'REJECTED' && (
        <div>
          <TaskButton size="small" variant="ghost" onClick={onRestore}>
            <IconRestore size={14} />
            {t('Restore')}
          </TaskButton>
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
