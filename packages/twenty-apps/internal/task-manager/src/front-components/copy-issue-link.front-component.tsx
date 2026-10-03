import { useEffect, useRef } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
  unmountFrontComponent,
  useRecordId,
} from 'twenty-sdk/front-component';

import { COPY_ISSUE_LINK_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { buildRecordUrl } from './utils/build-record-url.util';
import { readRecordPageBaseUrl } from './utils/read-record-page-base-url.util';

// Headless: it draws nothing, copies the issue's URL and takes itself off.
//
// This is the only shape an app can give a button in a widget's own header.
// That row is WidgetCardHeader, and the single slot it offers a FRONT_COMPONENT
// widget is headerCommandMenuItemUniversalIdentifiers; a command menu item in
// turn must name a front component. A component declared isHeadless is mounted
// by useCommandMenuItemClick without opening a side panel, which is what turns
// that chain into a plain icon button.
//
// The record arrives as a prop — HeadlessFrontComponentRendererEngineCommand
// passes the context store's selection straight to the renderer — so there is
// no load to wait for and the id is there on the first render.
const CopyIssueLink = () => {
  const issueId = useRecordId();
  // Mounting is the whole action, and the host keeps the command mounted until
  // it unmounts itself: running twice would copy twice and announce twice.
  // oxlint-disable-next-line twenty/no-state-useref
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    const run = async () => {
      try {
        if (issueId === null) {
          await enqueueSnackbar({
            message: t('No issue selected.'),
            variant: 'error',
          });

          return;
        }

        await copyToClipboard(
          buildRecordUrl({
            baseUrl: readRecordPageBaseUrl(),
            objectNameSingular: 'issue',
            recordId: issueId,
          }),
        );
        await enqueueSnackbar({
          message: t('Link copied'),
          variant: 'success',
        });
      } finally {
        // In `finally`, so a refused clipboard write leaves no command stuck
        // mounted — a mounted command renders its button disabled.
        await unmountFrontComponent();
      }
    };

    void run();
  }, [issueId]);

  return null;
};

export default defineFrontComponent({
  universalIdentifier: COPY_ISSUE_LINK_FRONT_COMPONENT_UID,
  name: 'copy-issue-link',
  description:
    "Copies the issue's record page URL to the clipboard, then unmounts.",
  isHeadless: true,
  component: CopyIssueLink,
});
