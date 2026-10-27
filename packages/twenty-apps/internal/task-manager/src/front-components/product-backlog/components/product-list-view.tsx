import { useMemo, useState } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import {
  IconLayoutList,
  IconLock,
  IconMap,
  IconPlus,
  IconSparkles,
  IconX,
} from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../../../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../../../constants/issue-type-options';
import { BACKLOG_SECTION_KEY } from '../../../types/backlog';
import {
  type ProductItem,
  type ProductSprint,
} from '../../../types/product-backlog';
import { readEpicColor } from '../../../utils/epic-color.util';
import { type BacklogHealthFilterId } from '../../../utils/product-backlog/backlog-health.util';
import { sumStoryPoints } from '../../../utils/product-backlog/backlog-metrics.util';
import { TaskAvatar } from '../../components/task-avatar';
import {
  TaskBacklogRow,
  type TaskBacklogRowEditing,
  UNASSIGNED_OPTION_VALUE,
} from '../../components/task-backlog-row';
import { TaskBacklogSection } from '../../components/task-backlog-section';
import {
  IssueTypeGlyph,
  UnassignedAvatar,
} from '../../components/task-board-card';
import { TaskBoardSelect } from '../../components/task-board-select';
import { TaskButton } from '../../components/task-button';
import { TaskChip } from '../../components/task-chip';
import { TaskIconButton } from '../../components/task-icon-button';
import { TaskPriorityGlyph } from '../../components/task-priority-glyph';
import {
  readStatusGlyph,
  TaskStatusIcon,
} from '../../components/task-status-icon';
import { TaskTabs } from '../../components/task-tabs';
import { TaskTextInput } from '../../components/task-text-input';
import {
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { formatSprintDateRange } from '../../utils/format-sprint-date-range.util';
import { readMemberName } from '../../utils/read-member-name.util';
import {
  readHealthFilterLabel,
  useBacklogHealth,
} from '../hooks/use-backlog-health';
import { type ProductViewProps } from '../types/product-view-props';
import { ProductRefinementView } from './product-refinement-view';
import { ProductStoryMap } from './product-story-map';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductReadinessDot,
} from './product-ui';

type ListMode = 'list' | 'map' | 'refine';

type DropTarget = { sectionKey: string; beforeIssueId: string | null };

// The backlog shows this many rows before asking, like the Board's columns.
const BACKLOG_PAGE_SIZE = 50;

type ProductListViewProps = ProductViewProps & {
  matchesFilters: (item: ProductItem) => boolean;
  healthFilterId: BacklogHealthFilterId | null;
  onClearHealthFilter: () => void;
  isComposerOpen: boolean;
  onComposerOpenChange: (isOpen: boolean) => void;
  onPlanSprint: (sprintId: string) => void;
  onOpenPrioritize: () => void;
};

const readSectionSprintId = (sectionKey: string) =>
  sectionKey === BACKLOG_SECTION_KEY ? null : sectionKey;

// Planned sprints, then the backlog, each ranked by drag. Only items live
// here: once a sprint starts, its items become issues on the Board.
export const ProductListView = ({
  data,
  model,
  actions,
  reload,
  inset,
  isMobile,
  onOpenItem,
  matchesFilters,
  healthFilterId,
  onClearHealthFilter,
  isComposerOpen,
  onComposerOpenChange,
  onPlanSprint,
  onOpenPrioritize,
}: ProductListViewProps) => {
  const locale = useLocale();
  const [mode, setMode] = useState<ListMode>('list');
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [visibleBacklogCount, setVisibleBacklogCount] =
    useState(BACKLOG_PAGE_SIZE);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerType, setComposerType] = useState('STORY');
  const [composerKey, setComposerKey] = useState(0);
  const health = useBacklogHealth(data, model);
  const healthFilter =
    healthFilterId === null ? null : health.filters[healthFilterId];

  const visibleItems = useMemo(
    () =>
      data.items.filter(
        (item) =>
          matchesFilters(item) &&
          (healthFilter === null || healthFilter.test(item)),
      ),
    [data.items, matchesFilters, healthFilter],
  );

  const sections = [
    ...model.futureSprints.map((sprint) => ({
      key: sprint.id,
      sprint,
      items: visibleItems.filter((item) => item.sprintId === sprint.id),
      allItems: data.items.filter((item) => item.sprintId === sprint.id),
    })),
    {
      key: BACKLOG_SECTION_KEY,
      sprint: undefined as ProductSprint | undefined,
      items: visibleItems.filter(
        (item) => item.stage === 'ITEM' && typeof item.sprintId !== 'string',
      ),
      allItems: model.backlogItems,
    },
  ];

  const endDrag = () => {
    setDraggingIssueId(null);
    setDropTarget(null);
  };

  const drop = (target: DropTarget) => {
    const issueId = draggingIssueId;

    endDrag();

    if (issueId === null || issueId === target.beforeIssueId) {
      return;
    }

    void actions.rankItem({
      issueId,
      sprintId: readSectionSprintId(target.sectionKey),
      beforeIssueId: target.beforeIssueId,
    });
  };

  const assignableById = new Map(
    data.assignableMembers.map((member) => [member.id, member]),
  );
  const editingOptions = {
    statusOptions: data.issueStatuses.map((status) => ({
      value: status.id,
      label: status.name ?? status.id,
      icon: (
        <TaskStatusIcon
          glyph={readStatusGlyph(status, data.issueStatuses)}
          color={status.color}
        />
      ),
    })),
    priorityOptions: [...ISSUE_PRIORITY_OPTIONS].reverse().map((option) => ({
      value: option.value,
      label: t(option.label),
      icon: <TaskPriorityGlyph priority={option.value} />,
    })),
    assigneeOptions: [
      {
        value: UNASSIGNED_OPTION_VALUE,
        label: t('Unassigned'),
        icon: <UnassignedAvatar size={18} />,
      },
      ...data.assignableMembers.map((member) => {
        const name = readMemberName(assignableById, member.id, t('Unknown'));

        return {
          value: member.id,
          label: name,
          icon: (
            <TaskAvatar
              name={name}
              avatarUrl={member.avatarUrl}
              size={18}
              shouldShowTitle={false}
            />
          ),
        };
      }),
    ],
  };

  const readRowEditing = (issueId: string): TaskBacklogRowEditing | null =>
    !data.canWrite
      ? null
      : {
          ...editingOptions,
          onChangeStatus: (statusId) =>
            void actions.updateItem(issueId, { statusId }),
          onChangePriority: (priority) =>
            void actions.updateItem(issueId, { priority }),
          onChangeAssignee: (assigneeId) =>
            void actions.updateItem(issueId, {
              assigneeId:
                assigneeId === UNASSIGNED_OPTION_VALUE ? null : assigneeId,
            }),
        };

  const createItem = async () => {
    const title = composerTitle.trim();

    if (title === '') {
      return;
    }

    setComposerTitle('');
    setComposerKey((key) => key + 1);
    await actions.createItem({
      title,
      sprintId: null,
      issueType: composerType,
    });
  };

  const renderRow = (item: ProductItem, sectionKey: string) => {
    const epic = model.epicsById.get(item.epicId ?? '');
    const status = model.statusesById.get(item.statusId ?? '');
    const blockers = model.blockersOf(item);

    return (
      <TaskBacklogRow
        key={item.id}
        issue={item}
        epicName={epic === undefined ? null : (epic.name ?? null)}
        epicColor={epic === undefined ? null : readEpicColor(epic)}
        statusName={status?.name ?? null}
        statusColor={status?.color ?? null}
        statusGlyph={readStatusGlyph(status, data.issueStatuses)}
        isDone={model.doneStatusIds.has(item.statusId ?? '')}
        assigneeName={
          typeof item.assigneeId === 'string'
            ? readMemberName(model.membersById, item.assigneeId, t('Unknown'))
            : null
        }
        assigneeAvatarUrl={
          model.membersById.get(item.assigneeId ?? '')?.avatarUrl
        }
        subtaskCount={0}
        isSelected={false}
        isChecked={false}
        isSelectionActive={false}
        onToggleChecked={null}
        isDragging={draggingIssueId === item.id}
        isDropTarget={
          dropTarget?.sectionKey === sectionKey &&
          dropTarget.beforeIssueId === item.id &&
          draggingIssueId !== item.id
        }
        canDrag={data.canWrite}
        isCompact={isMobile}
        inset={inset}
        editing={readRowEditing(item.id)}
        onOpen={() => onOpenItem(item.id)}
        onDragStartRow={() => setDraggingIssueId(item.id)}
        onDragEndRow={endDrag}
        onDragOverRow={() =>
          setDropTarget({ sectionKey, beforeIssueId: item.id })
        }
        onDropRow={() => drop({ sectionKey, beforeIssueId: item.id })}
        trailing={
          <>
            {blockers.length > 0 && (
              <TaskChip
                tone="danger"
                icon={<IconLock size={11} />}
                title={t('Blocked by {keys}', {
                  keys: blockers
                    .map((blocker) => blocker.issueKey ?? '')
                    .join(', '),
                })}
              >
                {blockers[0].issueKey ?? t('Blocked')}
              </TaskChip>
            )}
            <span
              style={{
                display: 'inline-flex',
                justifyContent: 'center',
                width: 16,
              }}
            >
              <ProductReadinessDot percent={model.readinessOf(item).percent} />
            </span>
          </>
        }
      />
    );
  };

  const renderComposer = () =>
    !data.canWrite ? null : isComposerOpen ? (
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          boxShadow: `inset 0 0 0 1px ${TASK_TOKENS.accent}`,
          display: 'flex',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 8,
          padding: `6px ${inset.right}px 6px ${inset.left}px`,
        }}
      >
        <TaskBoardSelect
          ariaLabel={t('Item type')}
          variant="ghost"
          width="auto"
          value={composerType}
          options={ISSUE_TYPE_OPTIONS.filter(
            (option) => option.value !== 'SUBTASK',
          ).map((option) => ({
            value: option.value,
            label: t(option.label),
            icon: <IssueTypeGlyph issueType={option.value} />,
          }))}
          onChange={setComposerType}
        />
        <div
          style={{
            flex: 1,
            minWidth: isMobile ? '100%' : 0,
            order: isMobile ? -1 : 0,
          }}
        >
          <TaskTextInput
            key={composerKey}
            ariaLabel={t('Item title')}
            placeholder={t('Item title')}
            shouldAutoFocus
            value={composerTitle}
            onChange={setComposerTitle}
            onEnter={() => void createItem()}
            onEscape={() => onComposerOpenChange(false)}
            height={30}
          />
        </div>
        {!isMobile && (
          <span style={{ ...PRODUCT_MUTED_STYLE, whiteSpace: 'nowrap' }}>
            {t('Enter to create · Esc to cancel')}
          </span>
        )}
        <TaskIconButton
          label={t('Cancel')}
          onClick={() => onComposerOpenChange(false)}
        >
          <IconX size={14} />
        </TaskIconButton>
        <TaskButton
          size="compact"
          variant="primary"
          isDisabled={composerTitle.trim() === ''}
          onClick={() => void createItem()}
        >
          {t('Create')}
        </TaskButton>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => onComposerOpenChange(true)}
        style={{
          ...PRODUCT_MUTED_STYLE,
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          cursor: 'pointer',
          display: 'flex',
          fontSize: 13,
          gap: 8,
          minHeight: 34,
          padding: `0 ${inset.right}px 0 ${inset.left + 22}px`,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <IconPlus size={14} />
        {t('New item')}
      </button>
    );

  const listBody = (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        overflowY: 'auto',
        paddingBottom: 24,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      {sections.map((section) => {
        const isBacklog = section.sprint === undefined;
        const shownItems = isBacklog
          ? section.items.slice(0, visibleBacklogCount)
          : section.items;
        const hiddenCount = section.items.length - shownItems.length;
        const points = sumStoryPoints(section.allItems);
        const sprint = section.sprint;

        return (
          <TaskBacklogSection
            key={section.key}
            title={
              sprint === undefined ? t('Backlog') : (sprint.name ?? t('Sprint'))
            }
            description={
              sprint === undefined
                ? t('Items not in any sprint')
                : (sprint.goal ?? undefined)
            }
            dateRange={
              sprint === undefined
                ? null
                : formatSprintDateRange({
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    locale,
                  })
            }
            isActive={false}
            isCompact={isMobile}
            issueCountLabel={
              section.items.length === section.allItems.length
                ? t('{count} items', { count: section.allItems.length })
                : t('{shown} of {total} items', {
                    shown: section.items.length,
                    total: section.allItems.length,
                  })
            }
            storyPointTotal={points}
            capacity={
              sprint === undefined
                ? undefined
                : (sprint.capacity ??
                  (model.averageVelocityPoints || undefined))
            }
            isCollapsed={collapsedKeys.includes(section.key)}
            onToggleCollapsed={() =>
              setCollapsedKeys((current) =>
                current.includes(section.key)
                  ? current.filter((key) => key !== section.key)
                  : [...current, section.key],
              )
            }
            action={
              sprint === undefined ? null : (
                <TaskButton
                  size="small"
                  variant="ghost"
                  onClick={() => onPlanSprint(sprint.id)}
                >
                  {t('Plan sprint')}
                </TaskButton>
              )
            }
            menu={null}
            isDragActive={draggingIssueId !== null}
            isEndDropTarget={
              dropTarget?.sectionKey === section.key &&
              dropTarget.beforeIssueId === null
            }
            onDragOverEnd={() =>
              setDropTarget({ sectionKey: section.key, beforeIssueId: null })
            }
            onDropEnd={() =>
              drop({ sectionKey: section.key, beforeIssueId: null })
            }
            isEmpty={section.allItems.length === 0}
            inset={inset}
            progress={null}
            footer={
              <>
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleBacklogCount(
                        (count) => count + BACKLOG_PAGE_SIZE,
                      )
                    }
                    style={{
                      ...PRODUCT_MUTED_STYLE,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                      cursor: 'pointer',
                      padding: `8px ${inset.right}px 8px ${inset.left}px`,
                      textAlign: 'left',
                    }}
                  >
                    {t('{count} more items', { count: hiddenCount })}
                  </button>
                )}
                {isBacklog && renderComposer()}
              </>
            }
          >
            {shownItems.map((item) => renderRow(item, section.key))}
          </TaskBacklogSection>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: 10,
          padding: `8px ${inset.right}px 8px ${inset.left}px`,
        }}
      >
        <TaskTabs
          value={mode}
          onChange={setMode}
          tabs={[
            {
              value: 'list',
              label: t('List'),
              icon: <IconLayoutList size={14} />,
            },
            {
              value: 'map',
              label: t('Story map'),
              icon: <IconMap size={14} />,
            },
            {
              value: 'refine',
              label: t('Refinement'),
              icon: <IconSparkles size={14} />,
              count: health.horizon.notReadyItems.length,
            },
          ]}
        />
        {!isMobile && mode === 'list' && (
          <span style={PRODUCT_MUTED_STYLE}>
            {t(
              '● Definition of Ready · number = story points · scores live in',
            )}{' '}
            <button
              type="button"
              onClick={onOpenPrioritize}
              style={{
                ...PRODUCT_MUTED_STYLE,
                background: 'transparent',
                border: 'none',
                color: TASK_TOKENS.accent,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {t('Prioritize')}
            </button>
          </span>
        )}
      </div>
      {healthFilter !== null && mode !== 'refine' && (
        <div
          style={{
            ...PRODUCT_TEXT_STYLE,
            alignItems: 'center',
            background: TASK_TOKENS.accentSoft,
            display: 'flex',
            flexShrink: 0,
            gap: 8,
            padding: `6px ${inset.right}px 6px ${inset.left}px`,
          }}
        >
          <span>
            {t('Filtering: {label} · {count} items', {
              label: readHealthFilterLabel(
                healthFilter.id,
                model.template.name,
              ),
              count: visibleItems.length,
            })}
          </span>
          <TaskButton
            variant="ghost"
            size="small"
            onClick={onClearHealthFilter}
          >
            {t('Clear filter')}
          </TaskButton>
        </div>
      )}
      {mode === 'list' && listBody}
      {mode === 'map' && (
        <ProductStoryMap
          data={data}
          model={model}
          items={visibleItems}
          inset={inset}
          onOpenItem={onOpenItem}
        />
      )}
      {mode === 'refine' && (
        <ProductRefinementView
          data={data}
          model={model}
          actions={actions}
          inset={inset}
          isMobile={isMobile}
          horizon={health.horizon}
          onOpenItem={onOpenItem}
          reload={reload}
        />
      )}
    </div>
  );
};
