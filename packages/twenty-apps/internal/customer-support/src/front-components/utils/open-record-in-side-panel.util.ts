import { openSidePanelPage, SidePanelPages } from 'twenty-sdk/front-component';

// The side panel keeps the inbox in place behind the record, which is what a
// support agent jumping between a chat and its merchant or issue wants.
export const openRecordInSidePanel = (
  objectNameSingular: string,
  recordId: string,
): void => {
  void openSidePanelPage({
    page: SidePanelPages.ViewRecord,
    objectNameSingular,
    recordId,
  });
};
