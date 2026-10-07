import { useRef, useState } from 'react';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { type IssueDetailFieldKey } from '../../constants/issue-view-fields';
import { UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { type IssueDetail } from './use-issue-detail';

// Saves the project's choice of Details rows, shown at once and confirmed by
// the re-read: a refused write (no Manage Views) puts the rows back.
export const useHiddenDetailFields = ({
  detail,
  reload,
}: {
  detail: IssueDetail;
  reload: () => Promise<void>;
}) => {
  const [pendingHiddenFields, setPendingHiddenFields] = useState<
    IssueDetailFieldKey[] | null
  >(null);
  // Writes go out one after another and the pick stays on screen until the
  // last one is read back: quick toggles otherwise land out of order, or a
  // re-read of an earlier write paints over a later pick.
  // oxlint-disable-next-line twenty/no-state-useref
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingWriteCountRef = useRef(0);

  const saveHiddenDetailFields = (hiddenDetailFields: IssueDetailFieldKey[]) => {
    const projectId = detail.project?.id;

    if (projectId === undefined) {
      return;
    }

    setPendingHiddenFields(hiddenDetailFields);
    pendingWriteCountRef.current += 1;

    writeQueueRef.current = writeQueueRef.current.then(async () => {
      try {
        await postAppRoute(UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH, {
          projectId,
          hiddenDetailFields,
        });
      } catch (error) {
        void enqueueSnackbar({
          message: readErrorText(error),
          variant: 'error',
        });
      } finally {
        pendingWriteCountRef.current -= 1;

        if (pendingWriteCountRef.current === 0) {
          await reload();
          setPendingHiddenFields(null);
        }
      }
    });
  };

  return {
    detail:
      pendingHiddenFields === null
        ? detail
        : {
            ...detail,
            issueViewSettings: {
              ...detail.issueViewSettings,
              hiddenDetailFields: pendingHiddenFields,
            },
          },
    saveHiddenDetailFields,
  };
};
