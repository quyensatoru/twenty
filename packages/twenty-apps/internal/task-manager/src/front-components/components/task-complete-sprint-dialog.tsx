import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { COMPLETE_SPRINT_ROUTE_PATH } from '../../constants/route-paths';
import { type BoardSprint } from '../../types/task-board';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { TaskBoardSelect } from './task-board-select';
import { TaskButton } from './task-button';
import { TaskDialogField, TaskDialogFrame } from './task-dialog-frame';
import { TaskStatusLine } from './task-status-line';
import { TASK_TOKENS } from './task-tokens';

const NEW_SPRINT_VALUE = 'NEW_SPRINT';
const BACKLOG_VALUE = 'BACKLOG';

type CompletionCounts = {
  movedIssueCount: number;
  stayingIssueCount: number;
};

type TaskCompleteSprintDialogProps = {
  sprint: BoardSprint;
  // Where open issues can go besides the backlog and a new sprint.
  futureSprints: readonly BoardSprint[];
  onClose: () => void;
  onCompleted: () => void;
};

// Jira's Complete sprint dialog: how much is done, how much is open, and
// where the open work goes. The counts come from a dry run of the same route,
// so they follow the route's own rule for which issues move.
export const TaskCompleteSprintDialog = ({
  sprint,
  futureSprints,
  onClose,
  onCompleted,
}: TaskCompleteSprintDialogProps) => {
  const [counts, setCounts] = useState<CompletionCounts | null>(null);
  const [destination, setDestination] = useState<string>(
    futureSprints[0]?.id ?? NEW_SPRINT_VALUE,
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadCounts = async () => {
      try {
        const result = await postAppRoute<
          CompletionCounts & { success: true }
        >(COMPLETE_SPRINT_ROUTE_PATH, { sprintId: sprint.id, dryRun: true });

        if (isCurrent) {
          setCounts({
            movedIssueCount: result.movedIssueCount ?? 0,
            stayingIssueCount: result.stayingIssueCount ?? 0,
          });
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(readErrorText(loadError));
        }
      }
    };

    void loadCounts();

    return () => {
      isCurrent = false;
    };
  }, [sprint.id]);

  const complete = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      await postAppRoute(COMPLETE_SPRINT_ROUTE_PATH, {
        sprintId: sprint.id,
        ...(destination === NEW_SPRINT_VALUE
          ? { createNewSprint: true }
          : {
              targetSprintId:
                destination === BACKLOG_VALUE ? null : destination,
            }),
      });
      void enqueueSnackbar({
        message: t('Sprint completed.'),
        variant: 'success',
      });
      onCompleted();
    } catch (completeError) {
      setError(readErrorText(completeError));
    } finally {
      setIsCompleting(false);
    }
  };

  const hasOpenIssues = (counts?.movedIssueCount ?? 0) > 0;

  return (
    <TaskDialogFrame
      title={t('Complete {name}', { name: sprint.name ?? '' })}
      onClose={onClose}
      footer={
        <>
          <TaskButton variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </TaskButton>
          <TaskButton
            variant="primary"
            isDisabled={counts === null || isCompleting}
            onClick={() => void complete()}
          >
            {t('Complete sprint')}
          </TaskButton>
        </>
      }
    >
      <span style={{ color: TASK_TOKENS.textSecondary, fontSize: 13 }}>
        {counts === null
          ? t('Loading…')
          : t(
              'This sprint contains {doneCount} completed issues and {openCount} open issues.',
              {
                doneCount: counts.stayingIssueCount,
                openCount: counts.movedIssueCount,
              },
            )}
      </span>
      {hasOpenIssues && (
        <TaskDialogField label={t('Move open issues to')}>
          <TaskBoardSelect
            ariaLabel={t('Move open issues to')}
            width="100%"
            value={destination}
            options={[
              ...futureSprints.map((futureSprint) => ({
                value: futureSprint.id,
                label: futureSprint.name ?? futureSprint.id,
              })),
              { value: NEW_SPRINT_VALUE, label: t('New sprint') },
              { value: BACKLOG_VALUE, label: t('Backlog') },
            ]}
            onChange={setDestination}
          />
        </TaskDialogField>
      )}
      <TaskStatusLine text={error} tone="danger" />
    </TaskDialogFrame>
  );
};
