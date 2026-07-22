import { ProjectRecordFieldsPreview } from '@/project-management/components/ProjectRecordFieldsPreview';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { type ProjectSprint } from '@/project-management/hooks/useProjectSprints';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { Tag } from 'twenty-ui/data-display';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const SPRINT_STATUS_COLOR = {
  PLANNED: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
} as const;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledMain = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: 0;
  text-align: left;
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

type ProjectSprintRowProps = {
  sprint: ProjectSprint;
  issues: ProjectIssue[];
  isReadOnly: boolean;
  onStart: () => void;
  onComplete: () => void;
};

export const ProjectSprintRow = ({
  sprint,
  issues,
  isReadOnly,
  onStart,
  onComplete,
}: ProjectSprintRowProps) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const doneCount = issues.filter((issue) => issue.status === 'DONE').length;

  return (
    <StyledRow>
      <StyledMain
        type="button"
        onClick={() =>
          openRecordInSidePanel({
            objectNameSingular: 'sprint',
            recordId: sprint.id,
          })
        }
      >
        <StyledTitleRow>
          <StyledName>{sprint.name}</StyledName>
          <Tag
            color={SPRINT_STATUS_COLOR[sprint.status]}
            text={sprint.status}
          />
        </StyledTitleRow>
        <ProjectRecordFieldsPreview recordId={sprint.id} />
        <StyledMeta>
          {doneCount}/{issues.length} done
        </StyledMeta>
      </StyledMain>
      {!isReadOnly && sprint.status === 'PLANNED' && (
        <Button title="Start Sprint" size="small" onClick={onStart} />
      )}
      {!isReadOnly && sprint.status === 'ACTIVE' && (
        <Button
          title="Complete Sprint"
          size="small"
          variant="secondary"
          onClick={onComplete}
        />
      )}
    </StyledRow>
  );
};
