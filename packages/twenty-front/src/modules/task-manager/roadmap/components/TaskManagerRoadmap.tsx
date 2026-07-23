import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { Tag } from 'twenty-ui/data-display';
import { ProgressBar } from 'twenty-ui/feedback';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TaskManagerTopBar } from '@/task-manager/components/TaskManagerTopBar';
import { useTaskManagerIssues } from '@/task-manager/hooks/useTaskManagerIssues';

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

const StyledEpicCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  margin-bottom: ${themeCssVariables.spacing['4']};
  padding: ${themeCssVariables.spacing['3']};
`;

const StyledEpicHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  margin-bottom: ${themeCssVariables.spacing['2']};
`;

const StyledEpicTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledProgressLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledChildRow = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  padding: ${themeCssVariables.spacing['1.5']} 0;
`;

const StyledChildTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDueDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const formatDueDate = (dueDate: unknown): string | null =>
  typeof dueDate === 'string' ? new Date(dueDate).toLocaleDateString() : null;

const EpicGroup = ({
  epic,
  childIssues,
  onNavigateToIssue,
}: {
  epic: ObjectRecord;
  childIssues: ObjectRecord[];
  onNavigateToIssue: (issueId: string) => void;
}) => {
  const doneCount = childIssues.filter(
    (child) => child.status === 'DONE',
  ).length;
  const progress =
    childIssues.length === 0
      ? 0
      : Math.round((doneCount / childIssues.length) * 100);

  return (
    <StyledEpicCard>
      <StyledEpicHeader>
        <StyledEpicTitle>
          {epic.issueKey} — {epic.title}
        </StyledEpicTitle>
        <StyledProgressLabel>
          {doneCount}/{childIssues.length}
        </StyledProgressLabel>
      </StyledEpicHeader>
      <ProgressBar value={progress} withBorderRadius />
      {childIssues
        .slice()
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return (
            new Date(a.dueDate as string).getTime() -
            new Date(b.dueDate as string).getTime()
          );
        })
        .map((child) => (
          <StyledChildRow
            key={child.id}
            onClick={() => onNavigateToIssue(child.id)}
          >
            <Tag text={child.status as string} color="gray" />
            <StyledChildTitle>
              {child.issueKey} {child.title}
            </StyledChildTitle>
            {formatDueDate(child.dueDate) && (
              <StyledDueDate>{formatDueDate(child.dueDate)}</StyledDueDate>
            )}
          </StyledChildRow>
        ))}
    </StyledEpicCard>
  );
};

export const TaskManagerRoadmap = () => {
  const { t } = useLingui();
  const goToIssuePage = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;

  const { issues } = useTaskManagerIssues({ projectId });

  const epics = useMemo(
    () => issues.filter((issue) => issue.issueType === 'EPIC'),
    [issues],
  );

  const issuesWithoutEpic = useMemo(
    () =>
      issues.filter((issue) => issue.issueType !== 'EPIC' && !issue.parentId),
    [issues],
  );

  const handleNavigateToIssue = (issueId: string) => {
    goToIssuePage(`/task-manager/issue/${issueId}`);
  };

  return (
    <StyledPage>
      <TaskManagerTopBar />
      <StyledContent>
        {epics.map((epic) => (
          <EpicGroup
            key={epic.id}
            epic={epic}
            childIssues={issues.filter((issue) => issue.parentId === epic.id)}
            onNavigateToIssue={handleNavigateToIssue}
          />
        ))}
        {issuesWithoutEpic.length > 0 && (
          <StyledEpicCard>
            <StyledEpicHeader>
              <StyledEpicTitle>
                <Trans>No epic</Trans>
              </StyledEpicTitle>
            </StyledEpicHeader>
            {issuesWithoutEpic.map((issue) => (
              <StyledChildRow
                key={issue.id}
                onClick={() => handleNavigateToIssue(issue.id)}
              >
                <Tag text={issue.status as string} color="gray" />
                <StyledChildTitle>
                  {issue.issueKey} {issue.title}
                </StyledChildTitle>
                {formatDueDate(issue.dueDate) && (
                  <StyledDueDate>{formatDueDate(issue.dueDate)}</StyledDueDate>
                )}
              </StyledChildRow>
            ))}
          </StyledEpicCard>
        )}
        {epics.length === 0 && issuesWithoutEpic.length === 0 && (
          <StyledProgressLabel>{t`No issues yet.`}</StyledProgressLabel>
        )}
      </StyledContent>
    </StyledPage>
  );
};
