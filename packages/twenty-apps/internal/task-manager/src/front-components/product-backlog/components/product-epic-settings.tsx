import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlus, IconTrash } from 'twenty-ui/icon';

import { EPIC_COLOR_OPTIONS } from '../../../constants/epic-color-options';
import {
  CREATE_EPIC_ROUTE_PATH,
  DELETE_EPIC_ROUTE_PATH,
  EPIC_SUMMARIES_ROUTE_PATH,
  UPDATE_EPIC_ROUTE_PATH,
} from '../../../constants/route-paths';
import {
  type ProductBacklogData,
  type ProductEpic,
} from '../../../types/product-backlog';
import { type EpicSummary } from '../../../types/task-board';
import { pickNextEpicColor } from '../../../utils/epic-color.util';
import { TaskBoardSelect } from '../../components/task-board-select';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskIconButton } from '../../components/task-icon-button';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCard,
  ProductCommitTextInput,
} from './product-ui';

const NO_GOAL_VALUE = '';

type ProductEpicSettingsProps = {
  data: ProductBacklogData;
  reload: () => Promise<void>;
};

const reportError = (error: unknown) =>
  void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

// Where a project's epics are managed, now that the Board and the Product
// Backlog only filter by them. Every edit saves as it is made.
export const ProductEpicSettings = ({
  data,
  reload,
}: ProductEpicSettingsProps) => {
  const [patchesByEpicId, setPatchesByEpicId] = useState<
    Record<string, Partial<ProductEpic>>
  >({});
  const [summaries, setSummaries] = useState<Map<string, EpicSummary>>(
    new Map(),
  );
  const [deletingEpic, setDeletingEpic] = useState<ProductEpic | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const projectId = data.activeProjectId;
  const isReadOnly = !data.canWrite;
  const epics = data.epics.map((epic) => ({
    ...epic,
    ...patchesByEpicId[epic.id],
  }));

  useEffect(() => {
    if (projectId === null) {
      return;
    }

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
        // The card stays usable without progress.
      }
    };

    void loadSummaries();

    return () => {
      isCurrent = false;
    };
  }, [projectId, data.epics]);

  const updateEpic = async (epicId: string, patch: Partial<ProductEpic>) => {
    setPatchesByEpicId((current) => ({
      ...current,
      [epicId]: { ...current[epicId], ...patch },
    }));

    try {
      await postAppRoute(UPDATE_EPIC_ROUTE_PATH, { epicId, data: patch });
    } catch (error) {
      setPatchesByEpicId((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => id !== epicId),
        ),
      );
      reportError(error);
    }
  };

  const createEpic = async () => {
    if (projectId === null || isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      await postAppRoute(CREATE_EPIC_ROUTE_PATH, {
        projectId,
        data: {
          name: t('New epic'),
          color: pickNextEpicColor(epics.map((epic) => epic.color)),
          position: 'last',
        },
      });
      await reload();
    } catch (error) {
      reportError(error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteEpic = async (epicId: string) => {
    setDeletingEpic(null);

    try {
      await postAppRoute(DELETE_EPIC_ROUTE_PATH, { epicId });
      await reload();
    } catch (error) {
      reportError(error);
    }
  };

  const deletingIssueCount =
    deletingEpic === null
      ? 0
      : (summaries.get(deletingEpic.id)?.totalCount ?? 0);

  return (
    <ProductCard title={t('Epics')}>
      <span style={PRODUCT_MUTED_STYLE}>
        {t(
          'Group items and issues by epic and tie each epic to a strategic goal. Progress counts done issues over all issues of the epic. Filter by epic from Filter on the Board and the Product Backlog.',
        )}
      </span>
      {epics.length === 0 && (
        <span style={PRODUCT_MUTED_STYLE}>{t('No epic yet.')}</span>
      )}
      {epics.map((epic) => {
        const summary = summaries.get(epic.id);

        return (
          <div
            key={epic.id}
            style={{ alignItems: 'center', display: 'flex', gap: 6 }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>
              <TaskBoardSelect
                ariaLabel={t('Colour')}
                width={110}
                isDisabled={isReadOnly}
                value={(epic.color ?? '').toUpperCase()}
                options={EPIC_COLOR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.label),
                  color: option.color,
                }))}
                onChange={(color) => void updateEpic(epic.id, { color })}
              />
            </span>
            <ProductCommitTextInput
              ariaLabel={t('Epic name')}
              value={epic.name ?? ''}
              isDisabled={isReadOnly}
              onCommit={(name) =>
                name.trim() !== '' &&
                void updateEpic(epic.id, { name: name.trim() })
              }
            />
            <span style={{ display: 'flex', flexShrink: 0 }}>
              <TaskBoardSelect
                ariaLabel={t('Strategic goal')}
                width={170}
                isDisabled={isReadOnly}
                value={epic.strategicGoalId ?? NO_GOAL_VALUE}
                options={[
                  { value: NO_GOAL_VALUE, label: t('No goal') },
                  ...data.settings.goals.map((goal) => ({
                    value: goal.id,
                    label: goal.name,
                    color: goal.color,
                  })),
                ]}
                onChange={(value) =>
                  void updateEpic(epic.id, {
                    strategicGoalId: value === NO_GOAL_VALUE ? null : value,
                  })
                }
              />
            </span>
            <span
              title={t('Done issues / all issues of the epic')}
              style={{
                ...PRODUCT_MUTED_STYLE,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 40,
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {summary === undefined
                ? '–'
                : `${summary.doneCount}/${summary.totalCount}`}
            </span>
            {data.canSoftDelete && (
              <TaskIconButton
                label={t('Delete epic')}
                onClick={() =>
                  (summary?.totalCount ?? 0) > 0
                    ? setDeletingEpic(epic)
                    : void deleteEpic(epic.id)
                }
              >
                <IconTrash size={14} />
              </TaskIconButton>
            )}
          </div>
        );
      })}
      {!isReadOnly && (
        <div>
          <TaskButton
            size="small"
            variant="ghost"
            isDisabled={isCreating}
            onClick={() => void createEpic()}
          >
            <IconPlus size={14} />
            {t('Add epic')}
          </TaskButton>
        </div>
      )}

      {deletingEpic !== null && (
        <twenty-overlay>
          <TaskDialogFrame
            title={t('Delete epic "{name}"?', {
              name: deletingEpic.name ?? t('Untitled epic'),
            })}
            onClose={() => setDeletingEpic(null)}
            footer={
              <>
                <TaskButton
                  variant="ghost"
                  onClick={() => setDeletingEpic(null)}
                >
                  {t('Cancel')}
                </TaskButton>
                <TaskButton
                  variant="primary"
                  onClick={() => void deleteEpic(deletingEpic.id)}
                >
                  {t('Delete')}
                </TaskButton>
              </>
            }
          >
            <span style={PRODUCT_TEXT_STYLE}>
              {t(
                '{count} issues of this epic move to "No epic". They are not deleted.',
                { count: deletingIssueCount },
              )}
            </span>
          </TaskDialogFrame>
        </twenty-overlay>
      )}
    </ProductCard>
  );
};
