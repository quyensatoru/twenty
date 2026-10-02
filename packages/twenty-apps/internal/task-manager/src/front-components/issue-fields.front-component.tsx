import { useRef, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  openSidePanelPage,
  SidePanelPages,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';
import {
  IconProgressCheck,
  IconRocket,
  IconShoppingBag,
  IconStack2,
  IconUserCircle,
} from 'twenty-ui/icon';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_FIELDS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { TaskFieldRow } from './components/task-field-row';
import { TaskMerchantField } from './components/task-merchant-field';
import { TaskMessage } from './components/task-message';
import { TaskRecordChip } from './components/task-record-chip';
import {
  type TaskRelationOption,
  TaskRelationSelect,
} from './components/task-relation-select';
import { TaskSkeletonBlock } from './components/task-skeleton-block';
import { TaskStatusLine } from './components/task-status-line';
import { TaskTag } from './components/task-tag';
import { TASK_TOKENS } from './components/task-tokens';
import { useAssignableMembers } from './hooks/use-assignable-members';
import { type MemberRow, useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';
import { readMemberName } from './utils/read-member-name.util';

const SKELETON_ROW_HEIGHT = 32;
// Which field has its card open, if any. One at a time: a field that owns its
// own flag leaves the previous card on screen, and two cards over each other
// are both unreachable.
type OpenField =
  | 'status'
  | 'assignee'
  | 'reporter'
  | 'sprint'
  | 'epic'
  | 'merchants';
// Clearing a relation is an option in the list like any other, so it needs a
// value of its own; every id here is a uuid, so the empty string is free.
const NO_VALUE = '';

// The issue's relation fields, drawn by the app so their options can be
// narrowed to the issue's own project and to the people holding a grant on its
// app.
//
// Not the host's FIELDS widget, which still renders everything else on this
// record: a relation picker there queries the target object with the VIEWER's
// token, so its options are whatever the row-level predicates leave — the
// caller's apps, never one project inside them — `workspaceMember` carries no
// predicate at all, and `merchant` is an app-scope root with none either. The
// write side was never wrong (assertRelationTargetAppScope refuses a target out
// of scope); the picker simply offered choices the route would reject, and
// leaked the existence of other projects' records on the way.
const IssueFields = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openField, setOpenField] = useState<OpenField | null>(null);
  // Read inside the handler rather than passed to the fields: disabling all six
  // on every save repainted the whole panel twice per click, which is what the
  // picking felt like.
  // oxlint-disable-next-line twenty/no-state-useref
  const isSavingRef = useRef(false);
  // The value a picker was just given, shown before the server confirms it.
  // Saving re-runs the issue-detail route — ten scoped queries — and the chip
  // sitting on its old value until that returns is the lag.
  const [pendingPatch, setPendingPatch] = useState<Record<string, string | null>>(
    {},
  );

  const projectId =
    typeof data.issue?.projectId === 'string' ? data.issue.projectId : null;
  const assignableMembers = useAssignableMembers(projectId);

  const update = async (body: Record<string, unknown>) => {
    if (issueId === null || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, { issueId, ...body });
      setActionError(null);
      await reload();
      // Cleared only once the record carries the value, so nothing flickers
      // back to the old chip in between.
      setPendingPatch({});
    } catch (error) {
      setActionError(readErrorText(error));
      setPendingPatch({});
    } finally {
      isSavingRef.current = false;
    }
  };

  const setRelation = (field: string, recordId: string | null) => {
    setPendingPatch((patch) => ({ ...patch, [field]: recordId }));
    void update({ data: { [field]: recordId } });
  };

  const readRelation = (field: string, stored: string | null) =>
    field in pendingPatch ? pendingPatch[field] : stored;

  // The side panel, not a page navigation: clicking a relation chip in the
  // host's own Details widget opens the record beside the issue (the URL picks
  // up ?panel=/object/...), and leaving the record you are working on is not
  // what a chip is for.
  const openRecord = (objectNameSingular: string, recordId: string) =>
    void openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      objectNameSingular,
      recordId,
    });

  const buildOpenRecordProps = (
    objectNameSingular: string,
    recordId: string | null,
  ) =>
    recordId === null
      ? {}
      : { onOpenRecord: () => openRecord(objectNameSingular, recordId) };

  const buildOpenProps = (field: OpenField) => ({
    isOpen: openField === field,
    onOpenChange: (isOpen: boolean) => setOpenField(isOpen ? field : null),
  });

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TaskSkeletonBlock height={SKELETON_ROW_HEIGHT} />
        <TaskSkeletonBlock height={SKELETON_ROW_HEIGHT} />
        <TaskSkeletonBlock height={SKELETON_ROW_HEIGHT} />
      </div>
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

  const assignableById = new Map(
    assignableMembers.map((member) => [member.id, member]),
  );
  // Everyone the record already refers to, which is where a name comes from
  // when the person on the issue is no longer assignable.
  const referencedById = new Map<string, MemberRow>(
    data.members.map((member) => [member.id, member]),
  );

  const buildMemberChip = (member: MemberRow, detail?: string | null) => (
    <TaskRecordChip
      name={readMemberName(
        assignableById.has(member.id) ? assignableById : referencedById,
        member.id,
        member.userEmail ?? t('Unknown'),
      )}
      detail={detail ?? undefined}
      avatarUrl={member.avatarUrl}
    />
  );

  // A member who loses their grant stays on the issues they were already put
  // on. Leaving them out would render the row empty, which reads as "nobody is
  // assigned" rather than "the person assigned can no longer be picked".
  const buildMemberOptions = (
    currentMemberId: string | null,
  ): TaskRelationOption[] => {
    // Two people can carry the same display name, and then the list offers the
    // same row twice. The address is what tells them apart.
    const nameCounts = new Map<string, number>();

    for (const member of assignableMembers) {
      const name = readMemberName(assignableById, member.id, member.id);

      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }

    const options: TaskRelationOption[] = [
      { value: NO_VALUE, label: t('Unassigned'), chip: null },
      ...assignableMembers.map((member) => {
        const name = readMemberName(assignableById, member.id, member.id);
        const isAmbiguous = (nameCounts.get(name) ?? 0) > 1;

        return {
          value: member.id,
          label: `${name} ${member.userEmail ?? ''}`.trim(),
          chip: buildMemberChip(
            member,
            isAmbiguous && member.userEmail !== null ? member.userEmail : null,
          ),
          valueChip: buildMemberChip(member),
        };
      }),
    ];

    if (currentMemberId === null || assignableById.has(currentMemberId)) {
      return options;
    }

    const current = referencedById.get(currentMemberId);

    return [
      ...options,
      {
        value: currentMemberId,
        label: readMemberName(referencedById, currentMemberId, currentMemberId),
        chip:
          current === undefined ? (
            <TaskRecordChip name={t('Unknown')} />
          ) : (
            buildMemberChip(current, t('no longer has access'))
          ),
        valueChip:
          current === undefined ? (
            <TaskRecordChip name={t('Unknown')} />
          ) : (
            buildMemberChip(current)
          ),
      },
    ];
  };

  const buildTagOptions = ({
    emptyLabel,
    rows,
    color,
  }: {
    emptyLabel: string;
    rows: readonly {
      id: string;
      name?: string | null;
      color?: string | null;
    }[];
    color?: string;
  }): TaskRelationOption[] => [
    { value: NO_VALUE, label: emptyLabel, chip: null },
    ...rows.map((row) => ({
      value: row.id,
      label: row.name ?? row.id,
      chip: <TaskTag color={row.color ?? color}>{row.name ?? row.id}</TaskTag>,
    })),
  ];

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        // 24px row plus this is the 32px pitch the host's own field list runs
        // at; at 4 the app panel stepped 28 and the two columns drifted apart
        // row by row.
        gap: 8,
        width: '100%',
      }}
    >
      <TaskFieldRow label={t('Status')} Icon={IconProgressCheck}>
        <TaskRelationSelect
          ariaLabel={t('Status')}
          placeholder={t('Status')}
          {...buildOpenProps('status')}
          emptyOptionLabel={t('No status')}
          value={readRelation('statusId', data.issue.statusId ?? null)}
          {...buildOpenRecordProps(
            'issueStatus',
            readRelation('statusId', data.issue.statusId ?? null),
          )}
          options={buildTagOptions({
            emptyLabel: t('No status'),
            rows: data.issueStatuses,
          })}
          onChange={(statusId) => setRelation('statusId', statusId)}
        />
      </TaskFieldRow>

      <TaskFieldRow label={t('Assignee')} Icon={IconUserCircle}>
        <TaskRelationSelect
          ariaLabel={t('Assignee')}
          placeholder={t('Assignee')}
          {...buildOpenProps('assignee')}
          emptyOptionLabel={t('Unassigned')}
          value={readRelation('assigneeId', data.issue.assigneeId ?? null)}
          {...buildOpenRecordProps(
            'workspaceMember',
            readRelation('assigneeId', data.issue.assigneeId ?? null),
          )}
          options={buildMemberOptions(
            readRelation('assigneeId', data.issue.assigneeId ?? null),
          )}
          onChange={(assigneeId) => setRelation('assigneeId', assigneeId)}
        />
      </TaskFieldRow>

      <TaskFieldRow label={t('Reporter')} Icon={IconUserCircle}>
        <TaskRelationSelect
          ariaLabel={t('Reporter')}
          placeholder={t('Reporter')}
          {...buildOpenProps('reporter')}
          emptyOptionLabel={t('Unassigned')}
          value={readRelation('reporterId', data.issue.reporterId ?? null)}
          {...buildOpenRecordProps(
            'workspaceMember',
            readRelation('reporterId', data.issue.reporterId ?? null),
          )}
          options={buildMemberOptions(
            readRelation('reporterId', data.issue.reporterId ?? null),
          )}
          onChange={(reporterId) => setRelation('reporterId', reporterId)}
        />
      </TaskFieldRow>

      <TaskFieldRow label={t('Sprint')} Icon={IconRocket}>
        <TaskRelationSelect
          ariaLabel={t('Sprint')}
          placeholder={t('Sprint')}
          {...buildOpenProps('sprint')}
          emptyOptionLabel={t('No sprint')}
          value={readRelation('sprintId', data.issue.sprintId ?? null)}
          {...buildOpenRecordProps(
            'sprint',
            readRelation('sprintId', data.issue.sprintId ?? null),
          )}
          options={buildTagOptions({
            emptyLabel: t('No sprint'),
            rows: data.sprints,
            color: 'purple',
          })}
          onChange={(sprintId) => setRelation('sprintId', sprintId)}
        />
      </TaskFieldRow>

      <TaskFieldRow label={t('Epic')} Icon={IconStack2}>
        <TaskRelationSelect
          ariaLabel={t('Epic')}
          placeholder={t('Epic')}
          {...buildOpenProps('epic')}
          emptyOptionLabel={t('No epic')}
          value={readRelation('epicId', data.issue.epicId ?? null)}
          {...buildOpenRecordProps(
            'epic',
            readRelation('epicId', data.issue.epicId ?? null),
          )}
          options={buildTagOptions({
            emptyLabel: t('No epic'),
            rows: data.epics,
            color: 'turquoise',
          })}
          onChange={(epicId) => setRelation('epicId', epicId)}
        />
      </TaskFieldRow>

      <TaskFieldRow label={t('Merchants')} Icon={IconShoppingBag}>
        <TaskMerchantField
          projectId={projectId}
          linkedMerchants={data.merchants}
          {...buildOpenProps('merchants')}
          onOpenMerchant={(merchantId) => openRecord('merchant', merchantId)}
          // The junction is reconciled to exactly this list by
          // linkIssueMerchants, so the whole set goes every time.
          onChange={(merchantIds) => void update({ merchantIds })}
        />
      </TaskFieldRow>

      {/* Only when there is one. The panel fills its widget exactly, and a
          line held open for a message that is almost never there is the
          difference between fitting and a scrollbar. */}
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
    "An issue's relation fields, with options narrowed to its project and to the members holding a grant on its app.",
  component: IssueFields,
});
