import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { IconArrowLeft, IconBrowserMaximize } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { FilesCard } from '@/activities/files/components/FilesCard';
import { TimelineCard } from '@/activities/timeline-activities/components/TimelineCard';
import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { RichTextFieldEditor } from '@/object-record/record-field/ui/meta-types/input/components/RichTextFieldEditor';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { TaskManagerFieldCell } from '@/task-manager/components/TaskManagerFieldCell';
import { IssueCommentThread } from '@/task-manager/issue-detail/components/IssueCommentThread';
import { IssueFieldPanel } from '@/task-manager/issue-detail/components/IssueFieldPanel';
import { useTaskManagerIssue } from '@/task-manager/issue-detail/hooks/useTaskManagerIssue';
import { LayoutRenderingProvider } from '@/ui/layout/contexts/LayoutRenderingContext';
import { ResizablePanelGap } from '@/ui/layout/resizable-panel/components/ResizablePanelGap';
import { type ResizablePanelConstraints } from '@/ui/layout/resizable-panel/types/ResizablePanelConstraints';
import { ViewType } from '@/views/types/ViewType';
import { PageLayoutType } from '~/generated-metadata/graphql';

const RIGHT_COLUMN_WIDTH_CSS_VAR =
  '--task-manager-issue-detail-right-column-width';
const RIGHT_COLUMN_CONSTRAINTS: ResizablePanelConstraints = {
  min: 430,
  max: 560,
  default: 430,
};

const StyledPage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  column-gap: ${themeCssVariables.spacing['2']};
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['4']};
  row-gap: ${themeCssVariables.spacing['2']};
`;

const StyledHeaderLeft = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledHeaderRight = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing['2']};
  justify-content: flex-end;
`;

const StyledIssueKey = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledHeaderDivider = styled.div`
  background: ${themeCssVariables.border.color.medium};
  height: ${themeCssVariables.spacing['4']};
  width: 1px;
`;

const StyledBody = styled.div<{ isInSidePanel: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: ${({ isInSidePanel }) => (isInSidePanel ? 'column' : 'row')};
  min-height: 0;
  overflow-y: ${({ isInSidePanel }) => (isInSidePanel ? 'auto' : 'hidden')};
`;

const StyledLeftColumn = styled.div<{ isInSidePanel: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['6']};
  overflow-y: ${({ isInSidePanel }) => (isInSidePanel ? 'visible' : 'auto')};
  padding: ${themeCssVariables.spacing['4']};
`;

const StyledRightColumn = styled.div`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  overflow-y: auto;
  width: var(${RIGHT_COLUMN_WIDTH_CSS_VAR}, 320px);
`;

const StyledSidePanelFieldPanel = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
`;

const StyledTitleWrapper = styled.div`
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0 0 ${themeCssVariables.spacing['2']} 0;
  text-transform: uppercase;
`;

const StyledDescriptionBox = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['3']};
  transition: border-color ${themeCssVariables.animation.duration.fast};

  &:hover,
  &:focus-within {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledHeaderPill = styled.div`
  flex-shrink: 0;
`;

type TaskManagerIssueDetailProps = {
  issueId: string;
  isInSidePanel?: boolean;
};

export const TaskManagerIssueDetail = ({
  issueId,
  isInSidePanel = false,
}: TaskManagerIssueDetailProps) => {
  const { t } = useLingui();
  const goToPage = useNavigate();
  const { issue } = useTaskManagerIssue(issueId);
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const { closeSidePanelMenu } = useSidePanelMenu();

  const handlePopOutToFullPage = () => {
    closeSidePanelMenu();
    goToPage(getAppPath(AppPath.TaskManagerIssuePage, { issueId }));
  };

  const [rightColumnWidth, setRightColumnWidth] = useState(
    RIGHT_COLUMN_CONSTRAINTS.default,
  );

  useEffect(() => {
    document.documentElement.style.setProperty(
      RIGHT_COLUMN_WIDTH_CSS_VAR,
      `${rightColumnWidth}px`,
    );
  }, [rightColumnWidth]);

  if (!issue) {
    return null;
  }

  const getField = (fieldName: string) =>
    objectMetadataItem.fields.find((field) => field.name === fieldName)!;

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeaderLeft>
          {!isInSidePanel && (
            <LightIconButton
              Icon={IconArrowLeft}
              onClick={() => goToPage(-1)}
              accent="secondary"
            />
          )}
          <RecordFieldsScopeContextProvider
            value={{ scopeInstanceId: `issue-detail-header-type-${issueId}` }}
          >
            <StyledHeaderPill>
              <TaskManagerFieldCell
                recordId={issueId}
                fieldMetadataItem={getField('issueType')}
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={`header-${recordIndexId}`}
                showLabel={false}
              />
            </StyledHeaderPill>
          </RecordFieldsScopeContextProvider>
          <StyledIssueKey>{issue.issueKey}</StyledIssueKey>
        </StyledHeaderLeft>
        <StyledHeaderRight>
          <RecordFieldsScopeContextProvider
            value={{
              scopeInstanceId: `issue-detail-header-priority-${issueId}`,
            }}
          >
            <StyledHeaderPill>
              <TaskManagerFieldCell
                recordId={issueId}
                fieldMetadataItem={getField('priority')}
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={`header-${recordIndexId}`}
                showLabel={false}
              />
            </StyledHeaderPill>
          </RecordFieldsScopeContextProvider>
          <RecordFieldsScopeContextProvider
            value={{ scopeInstanceId: `issue-detail-header-status-${issueId}` }}
          >
            <StyledHeaderPill>
              <TaskManagerFieldCell
                recordId={issueId}
                fieldMetadataItem={getField('status')}
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={`header-${recordIndexId}`}
                showLabel={false}
              />
            </StyledHeaderPill>
          </RecordFieldsScopeContextProvider>
          <StyledHeaderDivider />
          {isInSidePanel && (
            <LightIconButton
              Icon={IconBrowserMaximize}
              onClick={handlePopOutToFullPage}
              accent="secondary"
              title={t`Open in full page`}
            />
          )}
          <ObjectOptionsDropdown
            objectMetadataItem={objectMetadataItem}
            recordIndexId={recordIndexId}
            viewType={ViewType.TABLE}
            dropdownId="task-manager-issue-detail-object-options-dropdown"
          />
        </StyledHeaderRight>
      </StyledHeader>
      <StyledBody isInSidePanel={isInSidePanel}>
        <StyledLeftColumn isInSidePanel={isInSidePanel}>
          <RecordFieldsScopeContextProvider
            value={{ scopeInstanceId: `issue-detail-title-${issueId}` }}
          >
            <StyledTitleWrapper>
              <TaskManagerFieldCell
                recordId={issueId}
                fieldMetadataItem={getField('title')}
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={`title-${recordIndexId}`}
                showLabel={false}
              />
            </StyledTitleWrapper>
          </RecordFieldsScopeContextProvider>

          {isInSidePanel && (
            <StyledSidePanelFieldPanel>
              <IssueFieldPanel
                recordId={issueId}
                objectMetadataItem={objectMetadataItem}
                recordIndexId={recordIndexId}
              />
            </StyledSidePanelFieldPanel>
          )}

          <div>
            <StyledSectionTitle>
              <Trans>Description</Trans>
            </StyledSectionTitle>
            <StyledDescriptionBox>
              <RichTextFieldEditor
                recordId={issueId}
                objectNameSingular="issue"
                fieldName="description"
              />
            </StyledDescriptionBox>
          </div>

          <div>
            <StyledSectionTitle>
              <Trans>Comments</Trans>
            </StyledSectionTitle>
            <IssueCommentThread issueId={issueId} />
          </div>

          <LayoutRenderingProvider
            value={{
              targetRecordIdentifier: {
                id: issueId,
                targetObjectNameSingular: 'issue',
              },
              layoutType: PageLayoutType.RECORD_PAGE,
              isInSidePanel,
            }}
          >
            <div>
              <StyledSectionTitle>
                <Trans>Activity</Trans>
              </StyledSectionTitle>
              <TimelineCard />
            </div>
            <div>
              <StyledSectionTitle>{t`Files`}</StyledSectionTitle>
              <FilesCard />
            </div>
          </LayoutRenderingProvider>
        </StyledLeftColumn>
        {!isInSidePanel && (
          <>
            <ResizablePanelGap
              side="left"
              constraints={RIGHT_COLUMN_CONSTRAINTS}
              currentWidth={rightColumnWidth}
              onWidthChange={setRightColumnWidth}
              onCollapse={() => {}}
              gapWidth={0}
              cssVariableName={RIGHT_COLUMN_WIDTH_CSS_VAR}
            />
            <StyledRightColumn>
              <IssueFieldPanel
                recordId={issueId}
                objectMetadataItem={objectMetadataItem}
                recordIndexId={recordIndexId}
              />
            </StyledRightColumn>
          </>
        )}
      </StyledBody>
    </StyledPage>
  );
};
