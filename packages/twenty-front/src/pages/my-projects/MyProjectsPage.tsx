import { getLinkToShowPage } from '@/object-metadata/utils/getLinkToShowPage';
import { ProjectRoleTag } from '@/project-management/components/ProjectRoleTag';
import { useMyProjectMemberships } from '@/project-management/hooks/useMyProjectMemberships';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { IconFolder } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledRow = styled(Link)`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: inherit;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} 0;
  text-decoration: none;
`;

const StyledProjectName = styled.span`
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledProjectKey = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

export const MyProjectsPage = () => {
  const { projectMemberships, loading } = useMyProjectMemberships();

  return (
    <PageCardLayout
      header={<PageHeader title="My Projects" Icon={IconFolder} />}
    >
      <StyledContainer>
        {!loading && projectMemberships.length === 0 && (
          <StyledEmptyState>
            You're not a member of any project yet.
          </StyledEmptyState>
        )}
        {projectMemberships
          .filter((membership) => isDefined(membership.project))
          .map((membership) => (
            <StyledRow
              key={membership.id}
              to={getLinkToShowPage('project', membership.project ?? {})}
            >
              <span>
                <StyledProjectName>
                  {membership.project?.name}
                </StyledProjectName>{' '}
                <StyledProjectKey>({membership.project?.key})</StyledProjectKey>
              </span>
              <ProjectRoleTag role={membership.projectRole} />
            </StyledRow>
          ))}
      </StyledContainer>
    </PageCardLayout>
  );
};
