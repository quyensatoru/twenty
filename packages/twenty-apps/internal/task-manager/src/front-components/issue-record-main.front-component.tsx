import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import { ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { SectionHeading } from './components/task-section-heading';
import { IssueActivity } from './components/issue-activity-panel';
import { IssueDescription } from './components/issue-description-panel';
import { IssueSubtasks } from './components/issue-subtasks-panel';
import { TASK_TOKENS } from './components/task-tokens';

// The record page's left column as one panel: description, subtasks and
// activity stacked with a single shared scroll, the way the board modal draws
// them. The three sections are the same components the standalone widgets
// render, so no behaviour or route is duplicated — only the widget cards
// between them are gone.
//
// No height of its own: the widget frame scrolls, and a fixed height here
// would turn each section's own height:100% frame into a viewport-tall box
// instead of letting the content flow.
const IssueRecordMain = () => (
  <main
    style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      gap: 20,
      paddingBottom: 16,
      width: '100%',
    }}
  >
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeading label={t('Description')} />
      <IssueDescription />
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeading label={t('Subtasks')} />
      <IssueSubtasks />
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionHeading label={t('Activity')} />
      <IssueActivity />
    </section>
  </main>
);

export default defineFrontComponent({
  universalIdentifier: ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
  name: 'issue-record-main',
  description:
    "An issue's description, subtasks and activity feed as one left-column panel, through the app's scoped routes.",
  component: IssueRecordMain,
});
