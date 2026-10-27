import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import {
  PRODUCT_BACKLOG_ROUTE_PATH,
  REORDER_ISSUES_ROUTE_PATH,
  SET_ISSUE_STAGE_ROUTE_PATH,
  UPDATE_PRODUCT_BACKLOG_SETTINGS_ROUTE_PATH,
} from '../../../constants/product-backlog';
import {
  CREATE_ISSUE_ROUTE_PATH,
  RANK_ISSUE_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
} from '../../../constants/route-paths';
import {
  type IssueStage,
  type ProductBacklogData,
  type ProductBacklogSettings,
  type ProductItem,
} from '../../../types/product-backlog';
import { readProductBacklogSettings } from '../../../utils/read-product-backlog-settings.util';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';

const readList = <TEntry>(value: unknown): TEntry[] =>
  Array.isArray(value) ? (value as TEntry[]) : [];

const readData = (result: Record<string, unknown>): ProductBacklogData => ({
  projects: readList(result.projects),
  activeProjectId:
    typeof result.activeProjectId === 'string' ? result.activeProjectId : null,
  settings: readProductBacklogSettings(result.settings),
  issueStatuses: readList(result.issueStatuses),
  sprints: readList(result.sprints),
  epics: readList(result.epics),
  items: readList(result.items),
  activeSprintIssues: readList(result.activeSprintIssues),
  doneAtByIssueId:
    typeof result.doneAtByIssueId === 'object' &&
    result.doneAtByIssueId !== null
      ? (result.doneAtByIssueId as Record<string, string>)
      : {},
  linkedIssues: readList(result.linkedIssues),
  ideas: readList(result.ideas),
  velocity: readList(result.velocity),
  members: readList(result.members),
  assignableMembers: readList(result.assignableMembers),
  currentWorkspaceMemberId:
    typeof result.currentWorkspaceMemberId === 'string'
      ? result.currentWorkspaceMemberId
      : null,
  access:
    result.access === 'EDIT' || result.access === 'NONE'
      ? result.access
      : 'VIEW',
  canConfigureAccess: result.canConfigureAccess === true,
  canWrite: result.canWrite === true,
  canSoftDelete: result.canSoftDelete === true,
});

const reportError = (error: unknown) =>
  void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

// The Product Backlog page's data and every write it makes. Writes are
// optimistic where the change is local to a row, and re-read the page where
// the server decides more than the row (stage moves, sprint changes).
export const useProductBacklog = (projectId: string | null, refreshKey = 0) => {
  const [data, setData] = useState<ProductBacklogData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Bumped per load, so an answer for a project left behind is dropped.
  // oxlint-disable-next-line twenty/no-state-useref
  const generationRef = useRef(0);

  const reload = useCallback(async () => {
    generationRef.current += 1;
    const generation = generationRef.current;

    try {
      const result = await postAppRoute<
        Record<string, unknown> & { success: true }
      >(PRODUCT_BACKLOG_ROUTE_PATH, projectId === null ? {} : { projectId });

      if (generation === generationRef.current) {
        setData(readData(result));
        setLoadError(null);
      }
    } catch (error) {
      if (generation === generationRef.current) {
        setLoadError(readErrorText(error));
      }
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [reload, refreshKey]);

  const patchItemsLocally = useCallback(
    (issueIds: readonly string[], patch: Partial<ProductItem>) =>
      setData((current) =>
        current === null
          ? current
          : {
              ...current,
              items: current.items.map((item) =>
                issueIds.includes(item.id) ? { ...item, ...patch } : item,
              ),
              activeSprintIssues: current.activeSprintIssues.map((item) =>
                issueIds.includes(item.id) ? { ...item, ...patch } : item,
              ),
            },
      ),
    [],
  );

  const actions = useMemo(
    () => ({
      updateItem: async (issueId: string, patch: Partial<ProductItem>) => {
        patchItemsLocally([issueId], patch);

        try {
          await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, { issueId, data: patch });
        } catch (error) {
          reportError(error);
          await reload();
        }
      },

      setStage: async (issueIds: readonly string[], stage: IssueStage) => {
        try {
          await postAppRoute(SET_ISSUE_STAGE_ROUTE_PATH, { issueIds, stage });
        } catch (error) {
          reportError(error);
        }

        await reload();
      },

      // A drag in the list, or "move to sprint": lands the item above
      // `beforeIssueId`, or at the end of the section when it is null.
      rankItem: async ({
        issueId,
        sprintId,
        beforeIssueId,
      }: {
        issueId: string;
        sprintId: string | null;
        beforeIssueId: string | null;
      }) => {
        setData((current) => {
          if (current === null) {
            return current;
          }

          const moved = current.items.find((item) => item.id === issueId);

          if (moved === undefined) {
            return current;
          }

          const rest = current.items.filter((item) => item.id !== issueId);
          const beforeIndex =
            beforeIssueId === null
              ? -1
              : rest.findIndex((item) => item.id === beforeIssueId);
          const nextItem = { ...moved, sprintId };
          const items =
            beforeIndex === -1
              ? [...rest, nextItem]
              : [
                  ...rest.slice(0, beforeIndex),
                  nextItem,
                  ...rest.slice(beforeIndex),
                ];

          return { ...current, items };
        });

        try {
          await postAppRoute(RANK_ISSUE_ROUTE_PATH, {
            issueId,
            sprintId,
            ...(beforeIssueId === null ? {} : { beforeIssueId }),
          });
        } catch (error) {
          reportError(error);
          await reload();
        }
      },

      reorderItems: async (issueIds: readonly string[]) => {
        if (data?.activeProjectId === null || data === null) {
          return;
        }

        try {
          await postAppRoute(REORDER_ISSUES_ROUTE_PATH, {
            projectId: data.activeProjectId,
            issueIds,
          });
        } catch (error) {
          reportError(error);
        }

        await reload();
      },

      createItem: async ({
        title,
        sprintId,
        issueType,
      }: {
        title: string;
        sprintId: string | null;
        issueType: string;
      }): Promise<string | null> => {
        if (data === null || data.activeProjectId === null) {
          return null;
        }

        try {
          const result = await postAppRoute<{
            success: true;
            issue?: { id?: string };
          }>(CREATE_ISSUE_ROUTE_PATH, {
            projectId: data.activeProjectId,
            data: {
              title,
              issueType,
              stage: 'ITEM',
              position: 'last',
              ...(sprintId === null ? {} : { sprintId }),
            },
          });

          await reload();

          return result.issue?.id ?? null;
        } catch (error) {
          reportError(error);

          return null;
        }
      },

      updateSettings: async (patch: Partial<ProductBacklogSettings>) => {
        if (data === null || data.activeProjectId === null) {
          return;
        }

        const previousSettings = data.settings;

        setData({ ...data, settings: { ...data.settings, ...patch } });

        try {
          await postAppRoute(UPDATE_PRODUCT_BACKLOG_SETTINGS_ROUTE_PATH, {
            projectId: data.activeProjectId,
            settings: patch,
          });
        } catch (error) {
          setData((current) =>
            current === null
              ? current
              : { ...current, settings: previousSettings },
          );
          reportError(error);
        }
      },
    }),
    [data, patchItemsLocally, reload],
  );

  return { data, setData, loadError, isLoading, reload, actions };
};

export type ProductBacklogActions = ReturnType<
  typeof useProductBacklog
>['actions'];
