import { AppPath, navigate } from 'twenty-sdk/front-component';

// Opens the host's own issue record page, which is where the RECORD_PAGE
// layout (fields, BlockNote description, comments, worklogs) lives.
export const openIssue = (issueId: string): void => {
  void navigate(AppPath.RecordShowPage, {
    objectNameSingular: 'issue',
    objectRecordId: issueId,
  });
};
