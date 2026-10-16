import { defineFrontComponent } from 'twenty-sdk/define';
import {
  AppPath,
  navigate,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';

import { ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { TaskBoardDetail } from './components/task-board-detail';
import { TaskMessage } from './components/task-message';

const NO_NAV_ISSUE_IDS: readonly string[] = [];

// The issue's record page: the same view the board opens as a modal, laid out
// as a page. One widget for the whole tab, so the page scrolls once and the
// properties stay beside the content instead of five fixed-height boxes.
const IssueRecordMain = () => {
  const issueId = useRecordId();

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  return (
    <TaskBoardDetail
      presentation="page"
      issueId={issueId}
      navIssueIds={NO_NAV_ISSUE_IDS}
      onSelectIssue={(linkedIssueId) =>
        void navigate(AppPath.RecordShowPage, {
          objectNameSingular: 'issue',
          objectRecordId: linkedIssueId,
        })
      }
      onClose={() => undefined}
      boardPath={null}
      onCardChanged={() => undefined}
    />
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
  name: 'issue-record-main',
  description:
    "An issue's record page: description, sub-issues, activity and every property beside them, through the app's scoped routes.",
  component: IssueRecordMain,
});
