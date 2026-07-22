import { ProjectRecordFieldsPreview } from '@/project-management/components/ProjectRecordFieldsPreview';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import {
  IconBookmark,
  IconExclamationCircle,
  IconSquareCheck,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const ISSUE_TYPE_ICON = {
  STORY: IconBookmark,
  TASK: IconSquareCheck,
  BUG: IconExclamationCircle,
} as const;

const StyledCard = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledFieldsPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

type ProjectIssueCardProps = {
  issue: ProjectIssue;
};

export const ProjectIssueCard = ({ issue }: ProjectIssueCardProps) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const TypeIcon = ISSUE_TYPE_ICON[issue.issueType];

  return (
    <StyledCard
      type="button"
      onClick={() =>
        openRecordInSidePanel({
          objectNameSingular: 'issue',
          recordId: issue.id,
        })
      }
    >
      <StyledTitleRow>
        <TypeIcon size={14} />
        <StyledName>{issue.name}</StyledName>
      </StyledTitleRow>
      <StyledFieldsPreview>
        <ProjectRecordFieldsPreview recordId={issue.id} />
      </StyledFieldsPreview>
    </StyledCard>
  );
};
