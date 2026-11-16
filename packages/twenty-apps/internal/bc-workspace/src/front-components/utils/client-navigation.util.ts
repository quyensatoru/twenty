import { AppPath, enqueueSnackbar, navigate } from 'twenty-sdk/front-component';

import { readErrorText } from './post-app-route.util';

export const openRecordPage = (objectNameSingular: string, objectRecordId: string) => {
  void navigate(AppPath.RecordShowPage, { objectNameSingular, objectRecordId }).catch(
    (error) => {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    },
  );
};

export const openCrispConversation = (conversationId: string) =>
  openRecordPage('crispConversation', conversationId);

export const openDeveloperIssue = (issueId: string) => openRecordPage('issue', issueId);
