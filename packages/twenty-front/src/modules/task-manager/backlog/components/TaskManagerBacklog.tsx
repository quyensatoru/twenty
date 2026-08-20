import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DragDropContext } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { BacklogSprintSection } from '@/task-manager/backlog/components/BacklogSprintSection';
import { TaskManagerTopBar } from '@/task-manager/components/TaskManagerTopBar';
import { useRecordDragToGroupReorder } from '@/task-manager/hooks/useRecordDragToGroupReorder';
import { useTaskManagerIssues } from '@/task-manager/hooks/useTaskManagerIssues';
import { useTaskManagerSprints } from '@/task-manager/hooks/useTaskManagerSprints';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing['4']};
`;

const BACKLOG_DROPPABLE_ID = 'null';

export const TaskManagerBacklog = () => {
  const { t } = useLingui();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;

  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { issues, refetch: refetchIssues } = useTaskManagerIssues({
    projectId,
  });
  const { sprints, refetch: refetchSprints } = useTaskManagerSprints({
    projectId,
  });

  const priorityField = objectMetadataItem.fields.find(
    (field) => field.name === 'priority',
  );

  const activeSprints = useMemo(
    () => sprints.filter((sprint) => sprint.state !== 'CLOSED'),
    [sprints],
  );

  const nextFutureSprintId = useMemo(
    () => activeSprints.find((sprint) => sprint.state === 'FUTURE')?.id,
    [activeSprints],
  );

  const issuesBySprint = useMemo(() => {
    const grouped = new Map<string, typeof issues>();

    grouped.set(
      BACKLOG_DROPPABLE_ID,
      issues
        .filter((issue) => !issue.sprintId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );

    for (const sprint of activeSprints) {
      grouped.set(
        sprint.id,
        issues
          .filter((issue) => issue.sprintId === sprint.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      );
    }

    return grouped;
  }, [issues, activeSprints]);

  const { handleDragEnd } = useRecordDragToGroupReorder({
    objectNameSingular: 'issue',
    groupFieldName: 'sprintId',
    recordsByGroup: issuesBySprint,
  });

  const handleSprintChanged = () => {
    refetchIssues();
    refetchSprints();
  };

  return (
    <StyledPage>
      <TaskManagerTopBar />
      <StyledContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          {activeSprints.map((sprint) => (
            <BacklogSprintSection
              key={sprint.id}
              sprint={sprint}
              droppableId={sprint.id}
              title={sprint.name as string}
              issues={issuesBySprint.get(sprint.id) ?? []}
              priorityField={priorityField}
              nextFutureSprintId={
                sprint.id === nextFutureSprintId
                  ? undefined
                  : nextFutureSprintId
              }
              onSprintChanged={handleSprintChanged}
            />
          ))}
          <BacklogSprintSection
            droppableId={BACKLOG_DROPPABLE_ID}
            title={t`Backlog`}
            issues={issuesBySprint.get(BACKLOG_DROPPABLE_ID) ?? []}
            priorityField={priorityField}
            onSprintChanged={handleSprintChanged}
          />
        </DragDropContext>
      </StyledContent>
    </StyledPage>
  );
};
