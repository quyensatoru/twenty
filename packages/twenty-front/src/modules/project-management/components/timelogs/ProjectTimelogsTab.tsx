import { ProjectRecordFieldsPreview } from '@/project-management/components/ProjectRecordFieldsPreview';
import { ProjectViewProvider } from '@/project-management/components/ProjectViewProvider';
import { ProjectViewToolbar } from '@/project-management/components/ProjectViewToolbar';
import { ProjectTimeLogForm } from '@/project-management/components/timelogs/ProjectTimeLogForm';
import { useProjectIssues } from '@/project-management/hooks/useProjectIssues';
import { useProjectTabView } from '@/project-management/hooks/useProjectTabView';
import { useProjectTimeLogsForView } from '@/project-management/hooks/useProjectTimeLogsForView';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const StyledRow = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;
`;

const StyledIssueName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type ProjectTimelogsTabProps = {
  projectId: string;
  isReadOnly: boolean;
};

export const ProjectTimelogsTab = ({
  projectId,
  isReadOnly,
}: ProjectTimelogsTabProps) => {
  const { viewId, loading } = useProjectTabView(
    'timelogs',
    'timeLog',
    projectId,
  );
  const recordIndexId = `pm-timelogs-timeLog-${projectId}`;

  if (loading || !viewId) {
    return <StyledEmptyState>Loading time logs…</StyledEmptyState>;
  }

  return (
    <ProjectViewProvider
      objectNameSingular="timeLog"
      viewId={viewId}
      recordIndexId={recordIndexId}
    >
      <ProjectViewToolbar />
      <ProjectTimelogsTabContent
        projectId={projectId}
        isReadOnly={isReadOnly}
      />
    </ProjectViewProvider>
  );
};

type ProjectTimelogsTabContentProps = ProjectTimelogsTabProps;

const ProjectTimelogsTabContent = ({
  projectId,
  isReadOnly,
}: ProjectTimelogsTabContentProps) => {
  const recordIndexId = `pm-timelogs-timeLog-${projectId}`;
  const { issues } = useProjectIssues(projectId);
  const projectIssueIds = new Set(issues.map((issue) => issue.id));
  const { timeLogs, refetch } = useProjectTimeLogsForView(
    projectIssueIds,
    recordIndexId,
  );
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  return (
    <StyledContainer>
      {!isReadOnly && (
        <ProjectTimeLogForm issues={issues} onCreated={() => void refetch()} />
      )}
      <StyledList>
        {timeLogs.length === 0 && (
          <StyledEmptyState>
            No time logged on this project yet.
          </StyledEmptyState>
        )}
        {timeLogs.map((timeLog) => (
          <StyledRow
            key={timeLog.id}
            type="button"
            onClick={() =>
              openRecordInSidePanel({
                objectNameSingular: 'timeLog',
                recordId: timeLog.id,
              })
            }
          >
            <StyledIssueName>{timeLog.issue?.name ?? '—'}</StyledIssueName>
            <ProjectRecordFieldsPreview recordId={timeLog.id} />
          </StyledRow>
        ))}
      </StyledList>
    </StyledContainer>
  );
};
