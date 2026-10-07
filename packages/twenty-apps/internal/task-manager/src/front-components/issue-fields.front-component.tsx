import { useRef, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  openSidePanelPage,
  SidePanelPages,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_FIELDS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type IssueRow } from '../types/task-manager-rows';
import { IssueDetailsPanel } from './components/issue-details-panel';
import { TaskMessage } from './components/task-message';
import { TaskSkeletonFieldRow } from './components/task-skeleton';
import { TaskStatusLine } from './components/task-status-line';
import {
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './components/task-tokens';
import { useHiddenDetailFields } from './hooks/use-hidden-detail-fields';
import { useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

const PANEL_STYLE = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: TASK_TOKENS.fontFamily,
  gap: 8,
  height: '100%',
  minHeight: 0,
  overflowY: 'auto',
  ...TASK_THIN_SCROLLBAR_STYLE,
  width: '100%',
} as const;

// The issue's Details on its record page: the same panel as the board's
// modal, with every field of the issue and the project's show/hide choice.
//
// It replaces the host's FIELDS widget rather than sitting above it. That
// widget cannot follow a project's choice of rows, and its relation pickers
// query the target object with the VIEWER's token, so their options are
// whatever the row-level predicates leave — the caller's apps, never one
// project inside them. The write side was never wrong
// (assertRelationTargetAppScope refuses a target out of scope); the picker
// simply offered choices the route would reject.
const IssueFields = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [actionError, setActionError] = useState<string | null>(null);
  // The values just picked, shown before the server confirms them: saving
  // re-runs the issue-detail route, and a chip sitting on its old value until
  // that returns is the lag.
  const [pendingPatch, setPendingPatch] = useState<Record<string, unknown>>({});
  // Writes in flight. The record is re-read once the last one lands, so a
  // quick second pick is not painted back while its own write is on the wire.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingWriteCountRef = useRef(0);
  const { detail: displayedDetail, saveHiddenDetailFields } =
    useHiddenDetailFields({ detail: data, reload });

  const update = async (body: Record<string, unknown>) => {
    if (issueId === null) {
      return;
    }

    const patch =
      typeof body.data === 'object' && body.data !== null
        ? (body.data as Record<string, unknown>)
        : {};

    setPendingPatch((current) => ({ ...current, ...patch }));
    pendingWriteCountRef.current += 1;

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, { issueId, ...body });
      setActionError(null);
    } catch (error) {
      setActionError(readErrorText(error));
    } finally {
      pendingWriteCountRef.current -= 1;

      if (pendingWriteCountRef.current === 0) {
        // The re-read is the truth either way: it confirms what succeeded and
        // puts back whatever a failed write had shown early.
        await reload();
        setPendingPatch({});
      }
    }
  };

  // The side panel, not a page navigation: a relation chip opens the record
  // beside the issue, the way the host's own field list does, and leaving the
  // record being worked on is not what a chip is for.
  const openRecord = (objectNameSingular: string, recordId: string) =>
    void openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      objectNameSingular,
      recordId,
    });

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <section style={PANEL_STYLE}>
        <TaskSkeletonFieldRow valueWidth={35} />
        <TaskSkeletonFieldRow valueWidth={55} />
        <TaskSkeletonFieldRow valueWidth={50} />
        <TaskSkeletonFieldRow valueWidth={30} />
        <TaskSkeletonFieldRow valueWidth={40} />
        <TaskSkeletonFieldRow valueWidth={60} />
      </section>
    );
  }

  if (data.issue === null) {
    return (
      <TaskMessage
        text={loadError ?? t('This issue is not available to you.')}
        tone={loadError === null ? 'neutral' : 'danger'}
      />
    );
  }

  return (
    <section style={PANEL_STYLE}>
      <IssueDetailsPanel
        key={data.issue.id}
        issue={{ ...data.issue, ...pendingPatch } as IssueRow}
        detail={displayedDetail}
        onUpdate={(body) => void update(body)}
        onError={setActionError}
        onHiddenFieldsChange={saveHiddenDetailFields}
        overlayOffsetX={-5}
        onOpenRecord={openRecord}
        onOpenIssue={(parentIssueId) => openRecord('issue', parentIssueId)}
      />
      {actionError !== null && (
        <TaskStatusLine text={actionError} tone="danger" />
      )}
    </section>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_FIELDS_FRONT_COMPONENT_UID,
  name: 'issue-fields',
  description:
    "An issue's Details panel: every field, editable in place, shown or hidden by the project's choice.",
  component: IssueFields,
});
