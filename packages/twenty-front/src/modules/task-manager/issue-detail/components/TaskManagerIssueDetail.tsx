import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { IconArrowLeft } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { FilesCard } from '@/activities/files/components/FilesCard';
import { TimelineCard } from '@/activities/timeline-activities/components/TimelineCard';
import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { RichTextFieldEditor } from '@/object-record/record-field/ui/meta-types/input/components/RichTextFieldEditor';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
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
  min: 400,
  max: 560,
  default: 400,
};

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  flex: 1;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing['2']} ${themeCssVariables.spacing['4']};
`;

const StyledHeaderLeft = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
`;

const StyledIssueKey = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const StyledLeftColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['6']};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing['4']};
`;

const StyledRightColumn = styled.div`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  overflow-y: auto;
  width: var(${RIGHT_COLUMN_WIDTH_CSS_VAR}, 320px);
`;

const StyledTitleWrapper = styled.div`
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0 0 ${themeCssVariables.spacing['2']} 0;
  text-transform: uppercase;
`;

type TaskManagerIssueDetailProps = {
  issueId: string;
};

export const TaskManagerIssueDetail = ({
  issueId,
}: TaskManagerIssueDetailProps) => {
  const { t } = useLingui();
  const goBack = useNavigate();
  const { issue } = useTaskManagerIssue(issueId);
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();

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

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeaderLeft>
          <LightIconButton
            Icon={IconArrowLeft}
            onClick={() => goBack(-1)}
            accent="secondary"
          />
          <StyledIssueKey>{issue.issueKey}</StyledIssueKey>
        </StyledHeaderLeft>
        <ObjectOptionsDropdown
          objectMetadataItem={objectMetadataItem}
          recordIndexId={recordIndexId}
          viewType={ViewType.TABLE}
        />
      </StyledHeader>
      <StyledBody>
        <StyledLeftColumn>
          <RecordFieldsScopeContextProvider
            value={{ scopeInstanceId: `issue-detail-title-${issueId}` }}
          >
            <StyledTitleWrapper>
              <TaskManagerFieldCell
                recordId={issueId}
                fieldMetadataItem={
                  objectMetadataItem.fields.find(
                    (field) => field.name === 'title',
                  )!
                }
                objectMetadataItem={objectMetadataItem}
                instanceIdPrefix={`title-${recordIndexId}`}
                showLabel={false}
              />
            </StyledTitleWrapper>
          </RecordFieldsScopeContextProvider>

          <div>
            <StyledSectionTitle>
              <Trans>Description</Trans>
            </StyledSectionTitle>
            <RichTextFieldEditor
              recordId={issueId}
              objectNameSingular="issue"
              fieldName="description"
            />
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
              isInSidePanel: false,
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
      </StyledBody>
    </StyledPage>
  );
};
