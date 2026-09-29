import { openSidePanelPage, SidePanelPages } from 'twenty-sdk/front-component';

// The fork opened the issue detail in the side panel when a card was clicked,
// keeping the board behind it. `navigate` would replace the board instead.
export const openIssue = (issueId: string): void => {
  void openSidePanelPage({
    page: SidePanelPages.ViewRecord,
    recordId: issueId,
    objectNameSingular: 'issue',
  });
};
