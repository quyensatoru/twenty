import { type ReactNode, useState } from 'react';
import { enqueueSnackbar, t, useLocale } from 'twenty-sdk/front-component';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconFlag,
  IconLock,
  IconPlayerPlay,
  IconPlus,
  IconTarget,
  IconTrash,
} from 'twenty-ui/icon';

import { MAX_SPRINT_ITEM_POINTS } from '../../../constants/product-backlog';
import {
  CREATE_SPRINT_ROUTE_PATH,
  DELETE_SPRINT_ROUTE_PATH,
  UPDATE_SPRINT_ROUTE_PATH,
} from '../../../constants/route-paths';
import {
  type ProductItem,
  type ProductSprint,
} from '../../../types/product-backlog';
import { buildDefaultSprintName } from '../../../utils/build-default-sprint-name.util';
import {
  readSprintScopeChange,
  sumStoryPoints,
} from '../../../utils/product-backlog/backlog-metrics.util';
import { TaskAvatar } from '../../components/task-avatar';
import {
  IssueTypeGlyph,
  UnassignedAvatar,
} from '../../components/task-board-card';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskIconButton } from '../../components/task-icon-button';
import { TaskProgressBar } from '../../components/task-progress-bar';
import { TaskSprintDialog } from '../../components/task-sprint-dialog';
import {
  readStatusGlyph,
  TaskStatusIcon,
} from '../../components/task-status-icon';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { formatSprintDateRange } from '../../utils/format-sprint-date-range.util';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import { readMemberName } from '../../utils/read-member-name.util';
import {
  dateInputToIso,
  toDateInputValue,
} from '../../utils/sprint-dates.util';
import { type ProductViewProps } from '../types/product-view-props';
import { ProductCompleteSprintDialog } from './product-complete-sprint-dialog';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCard,
  ProductCheckRow,
  ProductCommitTextInput,
  ProductEmpty,
  ProductKpi,
  ProductReadinessDot,
  ProductScoreBadge,
  ProductTextArea,
  ProductWarning,
} from './product-ui';

// Closed sprints kept in the picker, for a look back at what they delivered.
const CLOSED_SPRINTS_SHOWN = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type ProductSprintPlanningViewProps = ProductViewProps & {
  selectedSprintId: string | null;
  onSelectSprint: (sprintId: string | null) => void;
};

const reportError = (error: unknown) =>
  void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

// Plan one sprint at a time: a goal, a commitment checked against velocity,
// items picked from the backlog with their readiness and dependencies in
// view. Starting it puts its items on the Board.
export const ProductSprintPlanningView = (
  props: ProductSprintPlanningViewProps,
) => {
  const { data, model, reload, inset, selectedSprintId, onSelectSprint } =
    props;
  const locale = useLocale();
  const [isDeleting, setIsDeleting] = useState(false);
  const closedSprints = data.sprints
    .filter((sprint) => sprint.state === 'CLOSED')
    .sort((left, right) =>
      (left.completeDate ?? left.endDate ?? '').localeCompare(
        right.completeDate ?? right.endDate ?? '',
      ),
    )
    .slice(-CLOSED_SPRINTS_SHOWN);
  const pickerSprints = [
    ...closedSprints,
    ...(model.activeSprint === undefined ? [] : [model.activeSprint]),
    ...model.futureSprints,
  ];
  const sprint =
    pickerSprints.find((candidate) => candidate.id === selectedSprintId) ??
    model.futureSprints[0] ??
    model.activeSprint ??
    pickerSprints[pickerSprints.length - 1];

  const createSprint = async () => {
    const activeProject = data.projects.find(
      (project) => project.id === data.activeProjectId,
    );

    try {
      const result = await postAppRoute<{
        success: true;
        sprint?: { id?: string };
      }>(CREATE_SPRINT_ROUTE_PATH, {
        projectId: data.activeProjectId,
        data: {
          name: buildDefaultSprintName({
            projectKey: activeProject?.key ?? null,
            existingNames: data.sprints.map((candidate) => candidate.name),
          }),
          state: 'FUTURE',
          position: 'last',
        },
      });

      await reload();
      onSelectSprint(result.sprint?.id ?? null);
    } catch (error) {
      reportError(error);
    }
  };

  const deleteSprint = async (sprintToDelete: ProductSprint) => {
    setIsDeleting(false);

    try {
      await postAppRoute(DELETE_SPRINT_ROUTE_PATH, {
        sprintId: sprintToDelete.id,
      });
      onSelectSprint(null);
      await reload();
    } catch (error) {
      reportError(error);
    }
  };

  const sprintItems =
    sprint === undefined
      ? []
      : sprint.state === 'ACTIVE'
        ? data.activeSprintIssues
        : data.items.filter((item) => item.sprintId === sprint.id);

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 14,
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
          gap: 6,
        }}
      >
        {pickerSprints.map((candidate) => {
          const isSelected = candidate.id === sprint?.id;
          const stateColor =
            candidate.state === 'ACTIVE'
              ? readTagColor('green')
              : candidate.state === 'CLOSED'
                ? readTagColor('gray')
                : readTagColor('blue');

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelectSprint(candidate.id)}
              style={{
                ...PRODUCT_TEXT_STYLE,
                alignItems: 'center',
                background: isSelected
                  ? TASK_TOKENS.backgroundSelected
                  : TASK_TOKENS.background,
                border: `1px solid ${isSelected ? TASK_TOKENS.borderStrong : TASK_TOKENS.border}`,
                borderRadius: TASK_TOKENS.radiusSmall,
                cursor: 'pointer',
                display: 'inline-flex',
                gap: 6,
                height: 30,
                padding: '0 10px',
              }}
            >
              <strong>{candidate.name}</strong>
              <span
                style={{
                  background: stateColor.background,
                  borderRadius: TASK_TOKENS.radiusExtraSmall,
                  color: stateColor.text,
                  fontSize: 11,
                  padding: '0 5px',
                }}
              >
                {candidate.state === 'ACTIVE'
                  ? t('Running')
                  : candidate.state === 'CLOSED'
                    ? t('Done')
                    : t('Planned')}
              </span>
            </button>
          );
        })}
        {data.canWrite && (
          <TaskButton
            size="compact"
            variant="ghost"
            onClick={() => void createSprint()}
          >
            <IconPlus size={14} />
            {t('Create sprint')}
          </TaskButton>
        )}
      </div>

      {sprint === undefined ? (
        <ProductEmpty
          title={t('No sprint yet')}
          description={t(
            'Create a sprint, then pick items from the top of the backlog.',
          )}
        />
      ) : (
        <>
          <div
            style={{
              alignItems: 'baseline',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span
              style={{ ...PRODUCT_TEXT_STYLE, fontSize: 18, fontWeight: 600 }}
            >
              {sprint.name}
            </span>
            <span style={PRODUCT_MUTED_STYLE}>
              {formatSprintDateRange({
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                locale,
              }) ?? t('No dates yet')}
            </span>
            {sprint.state !== 'FUTURE' &&
              typeof sprint.goal === 'string' &&
              sprint.goal !== '' && (
                <span
                  style={{
                    ...PRODUCT_TEXT_STYLE,
                    alignItems: 'center',
                    display: 'inline-flex',
                    gap: 4,
                  }}
                >
                  <IconTarget size={14} />
                  {sprint.goal}
                </span>
              )}
            <span style={{ flex: 1 }} />
            {(sprint.state === 'FUTURE' || sprint.state === null) &&
              data.canSoftDelete && (
                <TaskButton
                  size="small"
                  variant="ghost"
                  onClick={() => setIsDeleting(true)}
                >
                  <IconTrash size={14} />
                  {t('Delete sprint')}
                </TaskButton>
              )}
          </div>
          {sprint.state === 'ACTIVE' && (
            <ActiveSprintPanel
              {...props}
              sprint={sprint}
              issues={sprintItems}
            />
          )}
          {(sprint.state === 'FUTURE' || sprint.state === null) && (
            <PlannedSprintPanel
              {...props}
              sprint={sprint}
              items={sprintItems}
            />
          )}
          {sprint.state === 'CLOSED' && (
            <ClosedSprintPanel {...props} sprint={sprint} />
          )}
        </>
      )}

      {isDeleting && sprint !== undefined && (
        <twenty-overlay>
          <TaskDialogFrame
            title={t('Delete {name}?', { name: sprint.name ?? '' })}
            onClose={() => setIsDeleting(false)}
            footer={
              <>
                <TaskButton
                  variant="ghost"
                  onClick={() => setIsDeleting(false)}
                >
                  {t('Cancel')}
                </TaskButton>
                <TaskButton
                  variant="primary"
                  onClick={() => void deleteSprint(sprint)}
                >
                  {t('Delete sprint')}
                </TaskButton>
              </>
            }
          >
            <span style={PRODUCT_TEXT_STYLE}>
              {sprintItems.length === 0
                ? t('The sprint has no items.')
                : t(
                    '{count} items ({points} pt) go back to the Product Backlog, keeping their scores and order.',
                    {
                      count: sprintItems.length,
                      points: sumStoryPoints(sprintItems),
                    },
                  )}
            </span>
          </TaskDialogFrame>
        </twenty-overlay>
      )}
    </div>
  );
};

type ItemLineProps = ProductViewProps & {
  item: ProductItem;
  warnings?: string[];
  action: ReactNode;
};

const ItemLine = ({
  item,
  model,
  onOpenItem,
  warnings = [],
  action,
}: ItemLineProps) => {
  const assigneeName =
    typeof item.assigneeId === 'string'
      ? readMemberName(model.membersById, item.assigneeId, t('Unknown'))
      : null;

  return (
    <div
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        display: 'flex',
        gap: 8,
        minHeight: 36,
        padding: '2px 0',
      }}
    >
      <ProductReadinessDot percent={model.readinessOf(item).percent} />
      <IssueTypeGlyph issueType={item.issueType ?? null} />
      <span style={{ ...PRODUCT_MUTED_STYLE, flexShrink: 0 }}>
        {item.issueKey}
      </span>
      <button
        type="button"
        onClick={() => onOpenItem(item.id)}
        style={{
          ...PRODUCT_TEXT_STYLE,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          padding: 0,
          textAlign: 'left',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.title}
      </button>
      {warnings.length > 0 && (
        <span
          title={warnings.join('\n')}
          style={{ color: readTagColor('orange').text, display: 'inline-flex' }}
        >
          <IconAlertTriangle size={14} />
        </span>
      )}
      <ProductScoreBadge
        scored={model.scoreOf(item)}
        template={model.template}
      />
      <span style={{ ...PRODUCT_MUTED_STYLE, textAlign: 'right', width: 24 }}>
        {item.storyPoints ?? '–'}
      </span>
      {assigneeName === null ? (
        <UnassignedAvatar size={18} />
      ) : (
        <TaskAvatar
          name={assigneeName}
          avatarUrl={model.membersById.get(item.assigneeId ?? '')?.avatarUrl}
          size={18}
          shouldShowTitle={false}
        />
      )}
      {action}
    </div>
  );
};

const ListCard = ({
  title,
  trailing,
  children,
}: {
  title: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) => (
  <ProductCard title={title} trailing={trailing} style={{ minHeight: 0 }}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 520,
        overflowY: 'auto',
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      {children}
    </div>
  </ProductCard>
);

const PlannedSprintPanel = (
  props: ProductSprintPlanningViewProps & {
    sprint: ProductSprint;
    items: ProductItem[];
  },
) => {
  const { data, model, actions, reload, isMobile, sprint, items } = props;
  const [isReadyFirst, setIsReadyFirst] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [deliverDraft, setDeliverDraft] = useState('');
  const [consequenceDraft, setConsequenceDraft] = useState('');
  const velocity = model.averageVelocityPoints;
  const committedPoints = sumStoryPoints(items);
  const isOverVelocity = velocity > 0 && committedPoints > velocity;
  const canWrite = data.canWrite;
  const sprintPositionById = new Map(
    items.map((item, index) => [item.id, index]),
  );

  const updateSprint = async (patch: Record<string, unknown>) => {
    try {
      await postAppRoute(UPDATE_SPRINT_ROUTE_PATH, {
        sprintId: sprint.id,
        data: patch,
      });
      await reload();
    } catch (error) {
      reportError(error);
    }
  };

  const readWarnings = (item: ProductItem) => {
    const warnings: string[] = [];
    const readiness = model.readinessOf(item);

    if (!readiness.isReady) {
      warnings.push(
        t('Not ready: {criteria}', {
          criteria: readiness.checks
            .filter((check) => !check.isMet)
            .map((check) => t(check.text))
            .join('; '),
        }),
      );
    }

    // A blocker planned earlier in this same sprint is fine.
    const openBlockers = model.blockersOf(item).filter((blocker) => {
      const blockerPosition = sprintPositionById.get(blocker.id);
      const itemPosition = sprintPositionById.get(item.id);

      return (
        blockerPosition === undefined ||
        itemPosition === undefined ||
        blockerPosition > itemPosition
      );
    });

    if (openBlockers.length > 0) {
      warnings.push(
        t('Waiting on: {keys}', {
          keys: openBlockers
            .map((blocker) => blocker.issueKey ?? '')
            .join(', '),
        }),
      );
    }

    if ((item.storyPoints ?? 0) > MAX_SPRINT_ITEM_POINTS) {
      warnings.push(t('Too big for one sprint: split it'));
    }

    return warnings;
  };

  const candidates = isReadyFirst
    ? [...model.backlogItems].sort(
        (left, right) =>
          Number(model.readinessOf(right).isReady) -
          Number(model.readinessOf(left).isReady),
      )
    : model.backlogItems;
  const itemsWithWarnings = items.filter(
    (item) => readWarnings(item).length > 0,
  );
  const hasActiveSprint = model.activeSprint !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          alignItems: 'flex-end',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: 220,
          }}
        >
          <span style={{ ...PRODUCT_MUTED_STYLE, fontWeight: 600 }}>
            {t('Name')}
          </span>
          <ProductCommitTextInput
            ariaLabel={t('Name')}
            value={sprint.name ?? ''}
            isDisabled={!canWrite}
            onCommit={(name) => void updateSprint({ name })}
          />
        </label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: 160,
          }}
        >
          <span style={{ ...PRODUCT_MUTED_STYLE, fontWeight: 600 }}>
            {t('Starts')}
          </span>
          <ProductCommitTextInput
            ariaLabel={t('Starts')}
            type="date"
            value={toDateInputValue(sprint.startDate)}
            isDisabled={!canWrite}
            onCommit={(value) =>
              void updateSprint({ startDate: dateInputToIso(value, 'start') })
            }
          />
        </label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            width: 160,
          }}
        >
          <span style={{ ...PRODUCT_MUTED_STYLE, fontWeight: 600 }}>
            {t('Ends')}
          </span>
          <ProductCommitTextInput
            ariaLabel={t('Ends')}
            type="date"
            value={toDateInputValue(sprint.endDate)}
            isDisabled={!canWrite}
            onCommit={(value) =>
              void updateSprint({ endDate: dateInputToIso(value, 'end') })
            }
          />
        </label>
        <span style={{ flex: 1 }} />
        {canWrite && (
          <TaskButton
            variant="primary"
            isDisabled={hasActiveSprint || items.length === 0}
            title={
              hasActiveSprint
                ? t('A sprint is already running: complete it first.')
                : items.length === 0
                  ? t('Add items before starting the sprint.')
                  : undefined
            }
            onClick={() => setIsStarting(true)}
          >
            <IconPlayerPlay size={14} />
            {t('Start sprint · push {count} items to the Board', {
              count: items.length,
            })}
          </TaskButton>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'minmax(260px, 0.9fr) minmax(0, 1.2fr) minmax(0, 1.2fr)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProductCard
            title={
              <>
                <IconTarget size={15} />
                {t('Sprint goal')}
              </>
            }
          >
            <ProductTextArea
              ariaLabel={t('Sprint goal')}
              value={sprint.goal ?? ''}
              placeholder={t('One sentence on the value this sprint delivers')}
              isDisabled={!canWrite}
              onCommit={(goal) => void updateSprint({ goal })}
            />
            {canWrite && (
              <>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'grid',
                    gap: 6,
                    gridTemplateColumns: '90px minmax(0, 1fr)',
                  }}
                >
                  <span style={PRODUCT_MUTED_STYLE}>{t('Deliver')}</span>
                  <ProductCommitTextInput
                    ariaLabel={t('Deliver')}
                    value={deliverDraft}
                    placeholder={t('email quota for merchants')}
                    onCommit={setDeliverDraft}
                  />
                  <span style={PRODUCT_MUTED_STYLE}>{t('Needs')}</span>
                  <span style={PRODUCT_TEXT_STYLE}>
                    {t('{count} items', { count: items.length })}
                  </span>
                  <span style={PRODUCT_MUTED_STYLE}>{t('Velocity')}</span>
                  <span style={PRODUCT_TEXT_STYLE}>{velocity} pt</span>
                  <span style={PRODUCT_MUTED_STYLE}>{t('So this sprint')}</span>
                  <ProductCommitTextInput
                    ariaLabel={t('So this sprint')}
                    value={consequenceDraft}
                    placeholder={t('puts notifications before integrations')}
                    onCommit={setConsequenceDraft}
                  />
                </div>
                <div>
                  <TaskButton
                    size="small"
                    variant="ghost"
                    onClick={() =>
                      void updateSprint({
                        goal: t(
                          'The goal is to deliver {deliver}. That takes {count} items. The team’s velocity is about {velocity} pt, so this sprint {consequence}.',
                          {
                            deliver: deliverDraft || '…',
                            count: items.length,
                            velocity,
                            consequence: consequenceDraft || '…',
                          },
                        ),
                      })
                    }
                  >
                    {t('Build the sprint goal')}
                  </TaskButton>
                </div>
              </>
            )}
          </ProductCard>
          <ProductCard title={t('Committed vs velocity')}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={PRODUCT_MUTED_STYLE}>{t('Committed')}</span>
                <strong
                  style={{
                    ...PRODUCT_TEXT_STYLE,
                    color: isOverVelocity
                      ? TASK_TOKENS.textDanger
                      : TASK_TOKENS.textPrimary,
                    fontSize: 18,
                  }}
                >
                  {committedPoints} pt
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={PRODUCT_MUTED_STYLE}>
                  {t('Average velocity (3 sprints)')}
                </span>
                <strong style={{ ...PRODUCT_TEXT_STYLE, fontSize: 18 }}>
                  {velocity} pt
                </strong>
              </div>
            </div>
            <TaskProgressBar
              width="100%"
              height={6}
              total={Math.max(1, velocity, committedPoints)}
              segments={[
                {
                  value: committedPoints,
                  color: isOverVelocity ? TASK_TOKENS.red : TASK_TOKENS.accent,
                  label: t('Committed'),
                },
              ]}
            />
            {isOverVelocity && (
              <ProductWarning>
                {t('{over} pt above velocity: drop items or split them.', {
                  over: committedPoints - velocity,
                })}
              </ProductWarning>
            )}
            {velocity === 0 && (
              <span style={PRODUCT_MUTED_STYLE}>
                {t('Velocity appears after the first completed sprint.')}
              </span>
            )}
          </ProductCard>
        </div>

        <ListCard
          title={t('Product backlog · {count}', { count: candidates.length })}
          trailing={
            <ProductCheckRow
              label={t('Ready first')}
              isChecked={isReadyFirst}
              onToggle={() => setIsReadyFirst(!isReadyFirst)}
            />
          }
        >
          {candidates.length === 0 && (
            <span style={PRODUCT_MUTED_STYLE}>
              {t('The backlog is empty.')}
            </span>
          )}
          {candidates.map((item) => (
            <ItemLine
              key={item.id}
              {...props}
              item={item}
              warnings={readWarnings(item)}
              action={
                canWrite ? (
                  <TaskIconButton
                    label={t('Add to sprint')}
                    onClick={() =>
                      void actions.rankItem({
                        issueId: item.id,
                        sprintId: sprint.id,
                        beforeIssueId: null,
                      })
                    }
                  >
                    <IconArrowRight size={15} />
                  </TaskIconButton>
                ) : null
              }
            />
          ))}
        </ListCard>

        <ListCard
          title={t('{name} · {count} items · {points}/{velocity} pt', {
            name: sprint.name ?? '',
            count: items.length,
            points: committedPoints,
            velocity,
          })}
        >
          {itemsWithWarnings.length > 0 && (
            <ProductWarning>
              {t(
                '{count} items are not ready or wait on a dependency: hover the warning to see why.',
                {
                  count: itemsWithWarnings.length,
                },
              )}
            </ProductWarning>
          )}
          {items.length === 0 && (
            <span style={PRODUCT_MUTED_STYLE}>
              {t(
                'Pick items from the backlog (→). The top of the backlog is usually the next sprint.',
              )}
            </span>
          )}
          {items.map((item) => (
            <ItemLine
              key={item.id}
              {...props}
              item={item}
              warnings={readWarnings(item)}
              action={
                canWrite ? (
                  <TaskIconButton
                    label={t('Back to backlog')}
                    onClick={() =>
                      void actions.rankItem({
                        issueId: item.id,
                        sprintId: null,
                        beforeIssueId: null,
                      })
                    }
                  >
                    <IconArrowLeft size={15} />
                  </TaskIconButton>
                ) : null
              }
            />
          ))}
        </ListCard>
      </div>

      {isStarting && (
        <twenty-overlay>
          <TaskSprintDialog
            mode="start"
            sprint={sprint}
            issueCount={items.length}
            onClose={() => setIsStarting(false)}
            onSaved={() => {
              setIsStarting(false);
              void reload();
            }}
          />
        </twenty-overlay>
      )}
    </div>
  );
};

const ActiveSprintPanel = (
  props: ProductSprintPlanningViewProps & {
    sprint: ProductSprint;
    issues: ProductItem[];
  },
) => {
  const { data, model, reload, sprint, issues } = props;
  const locale = useLocale();
  const [isCompleting, setIsCompleting] = useState(false);
  const doneIssues = issues.filter((issue) =>
    model.doneStatusIds.has(issue.statusId ?? ''),
  );
  const totalPoints = sumStoryPoints(issues);
  const donePoints = sumStoryPoints(doneIssues);
  const endTime = Date.parse(sprint.endDate ?? '');
  const daysLeft = Number.isNaN(endTime)
    ? null
    : Math.max(0, Math.ceil((endTime - Date.now()) / DAY_IN_MS));
  const { addedIssues, addedPoints, removedIssues, removedPoints } =
    readSprintScopeChange({
      sprintId: sprint.id,
      committedIssueIds: sprint.committedIssueIds,
      sprintIssues: issues,
      items: data.items,
    });
  const statuses = [...data.issueStatuses].sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <ProductKpi
          label={t('Progress')}
          value={`${donePoints} / ${totalPoints} pt`}
          note={t('{done} of {total} issues done', {
            done: doneIssues.length,
            total: issues.length,
          })}
        />
        <ProductKpi
          label={t('Days left')}
          value={daysLeft ?? '–'}
          note={
            formatSprintDateRange({
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              locale,
            }) ?? undefined
          }
        />
        <ProductKpi
          label={t('Scope change')}
          value={
            removedPoints > 0
              ? `+${addedPoints} / −${removedPoints} pt`
              : `+${addedPoints} pt`
          }
          note={
            removedIssues.length > 0
              ? t('{added} issues added, {removed} removed after start', {
                  added: addedIssues.length,
                  removed: removedIssues.length,
                })
              : t('{count} issues added after start', {
                  count: addedIssues.length,
                })
          }
        />
        <ProductCard style={{ flex: '1 1 220px' }}>
          <span style={PRODUCT_MUTED_STYLE}>{t('By status')}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {statuses.map((status) => (
              <span
                key={status.id}
                style={{
                  ...PRODUCT_TEXT_STYLE,
                  alignItems: 'center',
                  display: 'inline-flex',
                  gap: 4,
                }}
              >
                <TaskStatusIcon
                  glyph={readStatusGlyph(status, statuses)}
                  color={status.color}
                />
                {issues.filter((issue) => issue.statusId === status.id).length}
              </span>
            ))}
          </div>
        </ProductCard>
      </div>
      <ListCard
        title={
          <>
            <IconLock size={15} />
            {t('Issues on the Board · {count}', { count: issues.length })}
          </>
        }
        trailing={
          data.canWrite ? (
            <TaskButton
              size="small"
              variant="primary"
              onClick={() => setIsCompleting(true)}
            >
              <IconFlag size={14} />
              {t('Complete sprint')}
            </TaskButton>
          ) : undefined
        }
      >
        <span style={PRODUCT_MUTED_STYLE}>
          {t(
            'Scope is locked while the sprint runs; issues added later count as scope change.',
          )}
        </span>
        {issues.map((issue) => {
          const status = model.statusesById.get(issue.statusId ?? '');

          return (
            <ItemLine
              key={issue.id}
              {...props}
              item={issue}
              action={
                <TaskStatusIcon
                  glyph={readStatusGlyph(status, statuses)}
                  color={status?.color}
                  title={status?.name ?? undefined}
                />
              }
            />
          );
        })}
      </ListCard>
      {isCompleting && (
        <twenty-overlay>
          <ProductCompleteSprintDialog
            sprint={sprint}
            issues={issues}
            doneStatusIds={model.doneStatusIds}
            nextSprint={model.futureSprints[0]}
            onClose={() => setIsCompleting(false)}
            onCompleted={() => {
              setIsCompleting(false);
              void reload();
            }}
          />
        </twenty-overlay>
      )}
    </div>
  );
};

const ClosedSprintPanel = ({
  data,
  sprint,
}: ProductSprintPlanningViewProps & { sprint: ProductSprint }) => {
  const velocity = data.velocity.find((entry) => entry.sprintId === sprint.id);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <ProductKpi
        label={t('Committed')}
        value={`${velocity?.committedPoints ?? sprint.committedPoints ?? 0} pt`}
      />
      <ProductKpi
        label={t('Completed')}
        value={`${velocity?.completedPoints ?? sprint.completedPoints ?? 0} pt`}
      />
    </div>
  );
};
