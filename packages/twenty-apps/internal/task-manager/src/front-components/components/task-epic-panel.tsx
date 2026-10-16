import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlus, IconX } from 'twenty-ui/icon';

import { EPIC_COLOR_OPTIONS } from '../../constants/epic-color-options';
import {
  CREATE_EPIC_ROUTE_PATH,
  DELETE_EPIC_ROUTE_PATH,
  EPIC_SUMMARIES_ROUTE_PATH,
  UPDATE_EPIC_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  type BoardEpic,
  type EpicSummary,
  type PageInset,
} from '../../types/task-board';
import { computeRankPosition } from '../../utils/compute-rank-position.util';
import { pickNextEpicColor, readEpicColor } from '../../utils/epic-color.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readColorLabel } from '../utils/read-color-label.util';
import { readErrorText } from '../utils/read-error-text.util';
import { TaskActionMenu } from './task-action-menu';
import { TaskColorDot } from './task-chip';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { TaskTextInput } from './task-text-input';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

// The epic filter: undefined = every issue, null = issues with no epic.
export type EpicFilter = string | null | undefined;

type TaskEpicPanelProps = {
  // On a phone the panel replaces the view instead of sitting beside it.
  isFullScreen: boolean;
  // The page's side padding, narrower on a phone.
  inset: PageInset;
  projectId: string;
  epics: readonly BoardEpic[];
  epicFilter: EpicFilter;
  onEpicFilterChange: (epicFilter: EpicFilter) => void;
  canWrite: boolean;
  canSoftDelete: boolean;
  refreshKey: number;
  refreshBoard: () => void;
  // A backlog row being dragged: an epic row takes it as "assign this epic".
  draggingIssueId: string | null;
  onAssignIssueToEpic: (issueId: string, epicId: string) => void;
  onClose: () => void;
};

// Jira's Epic panel beside the backlog and board: every epic of the project
// with its progress, a filter on click, an inline create, and a drop target
// for issues being planned into an epic.
export const TaskEpicPanel = ({
  isFullScreen,
  inset,
  projectId,
  epics,
  epicFilter,
  onEpicFilterChange,
  canWrite,
  canSoftDelete,
  refreshKey,
  refreshBoard,
  draggingIssueId,
  onAssignIssueToEpic,
  onClose,
}: TaskEpicPanelProps) => {
  const [summaries, setSummaries] = useState<Map<string, EpicSummary>>(
    new Map(),
  );
  const [isCreating, setIsCreating] = useState(false);
  // Enter and the Create button can both fire for the same name.
  const [isSubmittingEpic, setIsSubmittingEpic] = useState(false);
  const [newEpicName, setNewEpicName] = useState('');
  const [newEpicKey, setNewEpicKey] = useState(0);
  const [renamingEpicId, setRenamingEpicId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [draggingEpicId, setDraggingEpicId] = useState<string | null>(null);
  const [dropTargetEpicId, setDropTargetEpicId] = useState<string | null>(null);
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  // Loaded apart from the board read, so the board never waits on the counts.
  useEffect(() => {
    let isCurrent = true;

    const loadSummaries = async () => {
      try {
        const result = await postAppRoute<
          { summaries?: EpicSummary[] } & { success: true }
        >(EPIC_SUMMARIES_ROUTE_PATH, { projectId });

        if (isCurrent) {
          setSummaries(
            new Map(
              (result.summaries ?? []).map((summary) => [
                summary.epicId,
                summary,
              ]),
            ),
          );
        }
      } catch {
        // The panel stays usable without progress bars.
      }
    };

    void loadSummaries();

    return () => {
      isCurrent = false;
    };
  }, [projectId, refreshKey]);

  const runEpicWrite = async (
    routePath: string,
    body: Record<string, unknown>,
  ): Promise<boolean> => {
    try {
      await postAppRoute(routePath, body);
      refreshBoard();

      return true;
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

      return false;
    }
  };

  const createEpic = async () => {
    const name = newEpicName.trim();

    if (name === '' || isSubmittingEpic) {
      return;
    }

    setIsSubmittingEpic(true);

    const isCreated = await runEpicWrite(CREATE_EPIC_ROUTE_PATH, {
      projectId,
      data: {
        name,
        color: pickNextEpicColor(epics.map((epic) => epic.color)),
        position: 'last',
      },
    });

    setIsSubmittingEpic(false);

    if (isCreated) {
      setNewEpicName('');
      setNewEpicKey((key) => key + 1);
    }
  };

  const cancelCreatingEpic = () => {
    setIsCreating(false);
    setNewEpicName('');
  };

  const renameEpic = async (epicId: string) => {
    const name = renameDraft.trim();

    setRenamingEpicId(null);

    if (name !== '') {
      await runEpicWrite(UPDATE_EPIC_ROUTE_PATH, { epicId, data: { name } });
    }
  };

  // Lands the dragged epic just above the one it was dropped on.
  const reorderEpic = async (movedEpicId: string, targetEpicId: string) => {
    const remainingEpics = epics.filter((epic) => epic.id !== movedEpicId);
    const targetIndex = remainingEpics.findIndex(
      (epic) => epic.id === targetEpicId,
    );
    const target = remainingEpics[targetIndex];

    if (target === undefined || typeof target.position !== 'number') {
      return;
    }

    const previousPosition = remainingEpics[targetIndex - 1]?.position;

    await runEpicWrite(UPDATE_EPIC_ROUTE_PATH, {
      epicId: movedEpicId,
      data: {
        position: computeRankPosition({
          anchorPosition: target.position,
          neighborPosition:
            typeof previousPosition === 'number' ? previousPosition : null,
          side: 'before',
        }),
      },
    });
  };

  const dropOnEpic = (epicId: string) => {
    setDropTargetEpicId(null);

    if (draggingEpicId !== null) {
      const movedEpicId = draggingEpicId;

      setDraggingEpicId(null);

      if (movedEpicId !== epicId) {
        void reorderEpic(movedEpicId, epicId);
      }

      return;
    }

    if (draggingIssueId !== null) {
      onAssignIssueToEpic(draggingIssueId, epicId);
    }
  };

  const renderFilterRow = (
    rowKey: string,
    label: string,
    value: EpicFilter,
  ) => {
    const isSelected = epicFilter === value;

    return (
      <button
        key={rowKey}
        type="button"
        onClick={() => onEpicFilterChange(value)}
        onMouseEnter={() => setHoveredRowKey(rowKey)}
        onMouseLeave={() => setHoveredRowKey(null)}
        style={{
          alignItems: 'center',
          background: isSelected
            ? TASK_TOKENS.backgroundSelected
            : hoveredRowKey === rowKey
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          color: isSelected ? TASK_TOKENS.textPrimary : TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          flexShrink: 0,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: isSelected ? 500 : 400,
          minHeight: 30,
          padding: '0 8px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <aside
      style={{
        background: TASK_TOKENS.backgroundSecondary,
        borderRight: isFullScreen
          ? 'none'
          : `1px solid ${TASK_TOKENS.border}`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 2,
        minHeight: 0,
        padding: isFullScreen
          ? `8px ${inset.right}px 12px ${inset.left}px`
          : '8px 8px 12px 8px',
        width: isFullScreen ? '100%' : 236,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 2,
          minHeight: 28,
          padding: '0 2px 4px 8px',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            flex: 1,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {t('Epics')}
        </span>
        <TaskIconButton label={t('Close')} onClick={onClose}>
          <IconX size={14} />
        </TaskIconButton>
      </div>
      {renderFilterRow('ALL', t('All issues'), undefined)}
      {renderFilterRow('NONE', t('No epic'), null)}
      {/* Content-sized: the create control follows the last epic instead of
          sitting at the foot of an empty column, and the list only scrolls
          once it fills the panel. */}
      <div
        style={{
          display: 'flex',
          flex: '0 1 auto',
          flexDirection: 'column',
          gap: 2,
          marginTop: 6,
          minHeight: 0,
          overflowY: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
        }}
      >
        {epics.length === 0 && (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 12,
              lineHeight: '18px',
              padding: '4px 10px',
            }}
          >
            {t(
              'No epics yet. Use epics to group related issues into a larger piece of work.',
            )}
          </span>
        )}
        {epics.map((epic) => {
          const color = readEpicColor(epic);
          const summary = summaries.get(epic.id);
          const percent =
            summary === undefined || summary.totalCount === 0
              ? 0
              : Math.round((summary.doneCount / summary.totalCount) * 100);
          const isSelected = epicFilter === epic.id;
          const isDropTarget = dropTargetEpicId === epic.id;
          const isRowHovered = hoveredRowKey === epic.id;
          const epicTone = readTagColor(color).text;

          return (
            <div
              key={epic.id}
              draggable={canWrite && renamingEpicId !== epic.id}
              onDragStart={(event) => {
                try {
                  event.dataTransfer?.setData('text/plain', epic.id);
                } catch {
                  // Sandbox proxy: state carries the payload.
                }

                setDraggingEpicId(epic.id);
              }}
              onDragEnd={() => {
                setDraggingEpicId(null);
                setDropTargetEpicId(null);
              }}
              onDragOver={(event) => {
                if (draggingEpicId !== null || draggingIssueId !== null) {
                  event.preventDefault();
                  setDropTargetEpicId(epic.id);
                }
              }}
              onDragLeave={() =>
                setDropTargetEpicId((current) =>
                  current === epic.id ? null : current,
                )
              }
              onDrop={(event) => {
                event.preventDefault();
                dropOnEpic(epic.id);
              }}
              onMouseEnter={() => setHoveredRowKey(epic.id)}
              onMouseLeave={() => setHoveredRowKey(null)}
              style={{
                background: isDropTarget
                  ? TASK_TOKENS.accentSoft
                  : isSelected
                    ? TASK_TOKENS.backgroundSelected
                    : isRowHovered
                      ? TASK_TOKENS.backgroundHover
                      : 'transparent',
                borderRadius: TASK_TOKENS.radiusSmall,
                boxShadow: isDropTarget
                  ? draggingEpicId !== null
                    ? `inset 0 2px 0 ${TASK_TOKENS.accent}`
                    : `inset 0 0 0 1px ${TASK_TOKENS.accent}`
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                gap: 5,
                opacity: draggingEpicId === epic.id ? 0.5 : 1,
                padding: '6px 4px 7px 8px',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <TaskColorDot color={epicTone} />
                {renamingEpicId === epic.id ? (
                  <div style={{ flex: 1 }}>
                    <TaskTextInput
                      ariaLabel={t('Epic name')}
                      value={renameDraft}
                      onChange={setRenameDraft}
                      onEnter={() => void renameEpic(epic.id)}
                      onEscape={() => setRenamingEpicId(null)}
                      shouldAutoFocus
                      height={28}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onEpicFilterChange(isSelected ? undefined : epic.id)
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isSelected
                        ? TASK_TOKENS.textPrimary
                        : TASK_TOKENS.textSecondary,
                      cursor: 'pointer',
                      flex: 1,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      fontWeight: isSelected ? 500 : 400,
                      minWidth: 0,
                      overflow: 'hidden',
                      padding: 0,
                      textAlign: 'left',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {epic.name ?? t('(No title)')}
                  </button>
                )}
                <span
                  title={
                    summary === undefined
                      ? undefined
                      : t('{done} of {total} issues done', {
                          done: summary.doneCount,
                          total: summary.totalCount,
                        })
                  }
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 11.5,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {summary === undefined
                    ? ''
                    : `${summary.doneCount}/${summary.totalCount}`}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    visibility: isRowHovered || isSelected ? 'visible' : 'hidden',
                  }}
                >
                <TaskActionMenu
                  label={t('Epic actions')}
                  items={[
                    ...(canWrite
                      ? [
                          {
                            key: 'rename',
                            label: t('Rename'),
                            onSelect: () => {
                              setRenameDraft(epic.name ?? '');
                              setRenamingEpicId(epic.id);
                            },
                          },
                          ...EPIC_COLOR_OPTIONS.map((option) => ({
                            key: `color-${option.value}`,
                            label: readColorLabel(option.color),
                            color: option.color,
                            isSelected: color === option.color,
                            onSelect: () =>
                              void runEpicWrite(UPDATE_EPIC_ROUTE_PATH, {
                                epicId: epic.id,
                                data: { color: option.value },
                              }),
                          })),
                        ]
                      : []),
                    ...(canSoftDelete
                      ? [
                          {
                            key: 'delete',
                            label: t('Delete epic'),
                            isDanger: true,
                            confirmLabel:
                              (summary?.totalCount ?? 0) === 0
                                ? t('Confirm delete?')
                                : t('Delete · {count} issues lose this epic', {
                                    count: summary?.totalCount ?? 0,
                                  }),
                            onSelect: () => {
                              if (epicFilter === epic.id) {
                                onEpicFilterChange(undefined);
                              }

                              void runEpicWrite(DELETE_EPIC_ROUTE_PATH, {
                                epicId: epic.id,
                              });
                            },
                          },
                        ]
                      : []),
                  ]}
                />
                </span>
              </div>
              {summary !== undefined && summary.totalCount > 0 && (
                <span
                  style={{
                    background: TASK_TOKENS.backgroundTertiary,
                    borderRadius: 2,
                    display: 'flex',
                    height: 2,
                    marginLeft: 16,
                    marginRight: 6,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      background: epicTone,
                      display: 'block',
                      height: '100%',
                      width: `${percent}%`,
                    }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
      {canWrite &&
        (isCreating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <TaskTextInput
              key={newEpicKey}
              ariaLabel={t('Epic name')}
              placeholder={t('What needs to be done?')}
              value={newEpicName}
              onChange={setNewEpicName}
              onEnter={() => void createEpic()}
              onEscape={cancelCreatingEpic}
              shouldAutoFocus
            />
            <div
              style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
            >
              <TaskButton
                size="small"
                variant="ghost"
                onClick={cancelCreatingEpic}
              >
                {t('Cancel')}
              </TaskButton>
              <TaskButton
                size="small"
                variant="primary"
                isDisabled={newEpicName.trim() === '' || isSubmittingEpic}
                onClick={() => void createEpic()}
              >
                {isSubmittingEpic ? t('Creating…') : t('Create')}
              </TaskButton>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            onMouseEnter={() => setHoveredRowKey('CREATE')}
            onMouseLeave={() => setHoveredRowKey(null)}
            style={{
              alignItems: 'center',
              background:
                hoveredRowKey === 'CREATE'
                  ? TASK_TOKENS.backgroundHover
                  : 'transparent',
              border: 'none',
              borderRadius: TASK_TOKENS.radiusSmall,
              color: TASK_TOKENS.textTertiary,
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              gap: 6,
              minHeight: 30,
              padding: '0 8px',
            }}
          >
            <IconPlus size={14} />
            {t('New epic')}
          </button>
        ))}
    </aside>
  );
};
