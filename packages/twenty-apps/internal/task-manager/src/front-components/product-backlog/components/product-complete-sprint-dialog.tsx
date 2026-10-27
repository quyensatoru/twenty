import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { COMPLETE_SPRINT_ROUTE_PATH } from '../../../constants/route-paths';
import {
  type ProductItem,
  type ProductSprint,
} from '../../../types/product-backlog';
import { sumStoryPoints } from '../../../utils/product-backlog/backlog-metrics.util';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskTabs } from '../../components/task-tabs';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import { PRODUCT_MUTED_STYLE, PRODUCT_TEXT_STYLE } from './product-ui';

type CarryOver = 'next' | 'backlog';

type ProductCompleteSprintDialogProps = {
  sprint: ProductSprint;
  issues: readonly ProductItem[];
  doneStatusIds: ReadonlySet<string>;
  // Where "next sprint" goes; a new sprint is created when there is none.
  nextSprint: ProductSprint | undefined;
  onClose: () => void;
  onCompleted: () => void;
};

// Unfinished issues either carry over to the next sprint or go back to the
// Product Backlog as items, decided one by one; low priority defaults to the
// backlog.
export const ProductCompleteSprintDialog = ({
  sprint,
  issues,
  doneStatusIds,
  nextSprint,
  onClose,
  onCompleted,
}: ProductCompleteSprintDialogProps) => {
  const unfinished = issues.filter(
    (issue) => !doneStatusIds.has(issue.statusId ?? ''),
  );
  const done = issues.filter((issue) =>
    doneStatusIds.has(issue.statusId ?? ''),
  );
  const [carryOver, setCarryOver] = useState<Record<string, CarryOver>>(() =>
    Object.fromEntries(
      unfinished.map((issue) => [
        issue.id,
        issue.priority === 'LOW' || issue.priority === 'LOWEST'
          ? 'backlog'
          : 'next',
      ]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  const complete = async () => {
    setIsSaving(true);

    try {
      await postAppRoute(COMPLETE_SPRINT_ROUTE_PATH, {
        sprintId: sprint.id,
        ...(nextSprint === undefined
          ? { createNewSprint: true }
          : { targetSprintId: nextSprint.id }),
        backlogIssueIds: Object.entries(carryOver)
          .filter(([, destination]) => destination === 'backlog')
          .map(([issueId]) => issueId),
      });
      onCompleted();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
      setIsSaving(false);
    }
  };

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
            isDisabled={isSaving}
            onClick={() => void complete()}
          >
            {t('Complete sprint')}
          </TaskButton>
        </>
      }
    >
      <span style={PRODUCT_TEXT_STYLE}>
        {t(
          '{done} of {total} issues done · {donePoints} of {totalPoints} pt.',
          {
            done: done.length,
            total: issues.length,
            donePoints: sumStoryPoints(done),
            totalPoints: sumStoryPoints(issues),
          },
        )}
      </span>
      {unfinished.length > 0 && (
        <span style={PRODUCT_MUTED_STYLE}>
          {nextSprint === undefined
            ? t(
                'Unfinished issues: still a priority → a new sprint; otherwise → back to the Product Backlog as items.',
              )
            : t(
                'Unfinished issues: still a priority → {name}; otherwise → back to the Product Backlog as items.',
                {
                  name: nextSprint.name ?? '',
                },
              )}
        </span>
      )}
      {unfinished.map((issue) => (
        <div
          key={issue.id}
          style={{ alignItems: 'center', display: 'flex', gap: 8 }}
        >
          <span style={{ ...PRODUCT_MUTED_STYLE, flexShrink: 0 }}>
            {issue.issueKey}
          </span>
          <span
            style={{
              ...PRODUCT_TEXT_STYLE,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {issue.title}
          </span>
          <TaskTabs
            value={carryOver[issue.id] ?? 'next'}
            onChange={(destination) =>
              setCarryOver((current) => ({
                ...current,
                [issue.id]: destination,
              }))
            }
            tabs={[
              { value: 'next', label: t('Next sprint') },
              { value: 'backlog', label: t('Backlog') },
            ]}
          />
        </div>
      ))}
    </TaskDialogFrame>
  );
};
