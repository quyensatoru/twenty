import { ProjectEpicProgressBar } from '@/project-management/components/epics/ProjectEpicProgressBar';
import { ProjectRecordFieldsPreview } from '@/project-management/components/ProjectRecordFieldsPreview';
import { ProjectViewProvider } from '@/project-management/components/ProjectViewProvider';
import { ProjectViewToolbar } from '@/project-management/components/ProjectViewToolbar';
import { useProjectEpicsForView } from '@/project-management/hooks/useProjectEpicsForView';
import { useProjectTabView } from '@/project-management/hooks/useProjectTabView';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { Tag } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const EPIC_STATUS_COLOR = {
  TODO: 'gray',
  IN_PROGRESS: 'purple',
  DONE: 'green',
} as const;

const StyledContainer = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const StyledRow = styled.button`
  background: none;
  border: none;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;
`;

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type ProjectEpicsTabProps = {
  projectId: string;
};

export const ProjectEpicsTab = ({ projectId }: ProjectEpicsTabProps) => {
  const { viewId, loading } = useProjectTabView('epics', 'epic', projectId);
  const recordIndexId = `pm-epics-epic-${projectId}`;

  if (loading || !viewId) {
    return <StyledEmptyState>Loading epics…</StyledEmptyState>;
  }

  return (
    <ProjectViewProvider
      objectNameSingular="epic"
      viewId={viewId}
      recordIndexId={recordIndexId}
    >
      <ProjectViewToolbar />
      <ProjectEpicsTabContent projectId={projectId} />
    </ProjectViewProvider>
  );
};

type ProjectEpicsTabContentProps = ProjectEpicsTabProps;

const ProjectEpicsTabContent = ({ projectId }: ProjectEpicsTabContentProps) => {
  const recordIndexId = `pm-epics-epic-${projectId}`;
  const { epics } = useProjectEpicsForView(projectId, recordIndexId);
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  if (epics.length === 0) {
    return (
      <StyledEmptyState>
        No epics created for this project yet.
      </StyledEmptyState>
    );
  }

  return (
    <StyledContainer>
      {epics.map((epic) => {
        const doneCount = epic.issues.filter(
          (issue) => issue.status === 'DONE',
        ).length;

        return (
          <StyledRow
            key={epic.id}
            type="button"
            onClick={() =>
              openRecordInSidePanel({
                objectNameSingular: 'epic',
                recordId: epic.id,
              })
            }
          >
            <StyledTitleRow>
              <StyledName>{epic.name}</StyledName>
              <Tag color={EPIC_STATUS_COLOR[epic.status]} text={epic.status} />
            </StyledTitleRow>
            <ProjectRecordFieldsPreview recordId={epic.id} />
            <ProjectEpicProgressBar
              doneCount={doneCount}
              totalCount={epic.issues.length}
            />
            <StyledMeta>
              {doneCount}/{epic.issues.length} issues done
            </StyledMeta>
          </StyledRow>
        );
      })}
    </StyledContainer>
  );
};
