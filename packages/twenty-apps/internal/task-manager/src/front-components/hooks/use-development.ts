import { useCallback, useEffect, useRef, useState } from 'react';

import { DEVELOPMENT_LINKS_ROUTE_PATH } from '../../constants/route-paths';
import { type DevelopmentDeliveryRow } from '../../types/development-delivery';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

export type DevelopmentLinkRow = {
  id: string;
  linkType?: string | null;
  title?: string | null;
  url?: string | null;
  status?: string | null;
  externalId?: string | null;
  authorName?: string | null;
  repositoryId?: string | null;
  createdAt?: string | null;
};

export type DevelopmentRepositoryRow = {
  id: string;
  name?: string | null;
  provider?: string | null;
  slug?: string | null;
  remoteUrl?: string | null;
  isActive?: boolean | null;
  projectId?: string | null;
  hasWebhook?: boolean | null;
  syncState?: string | null;
  lastSyncedAt?: string | null;
  lastWebhookAt?: string | null;
  syncError?: string | null;
  webhookError?: string | null;
  liveSyncError?: string | null;
  unknownIssueKeys?: string[];
};

export type DevelopmentConnectionRow = {
  id: string;
  provider?: string | null;
  handle?: string | null;
};
export type DevelopmentData = {
  issueKey: string | null;
  projectId: string | null;
  links: DevelopmentLinkRow[];
  deliveries: DevelopmentDeliveryRow[];
  repositories: DevelopmentRepositoryRow[];
  connections: DevelopmentConnectionRow[];
  canWrite: boolean;
  applicationId: string | null;
};
const EMPTY_DEVELOPMENT: DevelopmentData = {
  issueKey: null,
  projectId: null,
  links: [],
  deliveries: [],
  repositories: [],
  connections: [],
  canWrite: false,
  applicationId: null,
};
const POLL_INTERVAL_MS = 5000;

// The route owns the row shape; ids guard against an absent collection on older installs.
const readRows = <TRow extends { id: string }>(value: unknown): TRow[] =>
  Array.isArray(value)
    ? value.filter(
        (row): row is TRow =>
          typeof row === 'object' && row !== null && typeof row.id === 'string',
      )
    : [];

export const useDevelopment = (issueId: string | null) => {
  const [snapshot, setSnapshot] = useState<{
    issueId: string | null;
    data: DevelopmentData;
    error: string | null;
    loaded: boolean;
  }>({ issueId: null, data: EMPTY_DEVELOPMENT, error: null, loaded: false });
  const requestNumber = useRef(0);
  const activeIssueId = useRef(issueId);
  activeIssueId.current = issueId;

  const reload = useCallback(async () => {
    const currentRequest = ++requestNumber.current;
    if (issueId === null) return;
    const isCurrent = () =>
      currentRequest === requestNumber.current &&
      activeIssueId.current === issueId;
    try {
      const result = await postAppRoute<{
        issue?: { issueKey?: string | null; projectId?: string | null };
        links?: unknown;
        deliveries?: unknown;
        repositories?: unknown;
        connections?: unknown;
        canWrite?: boolean;
        applicationId?: unknown;
        success: true;
      }>(DEVELOPMENT_LINKS_ROUTE_PATH, { issueId });
      if (!isCurrent()) return;
      setSnapshot({
        issueId,
        error: null,
        loaded: true,
        data: {
          issueKey: result.issue?.issueKey ?? null,
          projectId: result.issue?.projectId ?? null,
          links: readRows<DevelopmentLinkRow>(result.links),
          deliveries: readRows<DevelopmentDeliveryRow>(result.deliveries),
          repositories: readRows<DevelopmentRepositoryRow>(result.repositories),
          connections: readRows<DevelopmentConnectionRow>(result.connections),
          canWrite: result.canWrite === true,
          applicationId:
            typeof result.applicationId === 'string'
              ? result.applicationId
              : null,
        },
      });
    } catch (error) {
      if (isCurrent())
        setSnapshot((previous) => ({
          issueId,
          error: readErrorText(error),
          loaded: true,
          data:
            previous.issueId === issueId ? previous.data : EMPTY_DEVELOPMENT,
        }));
    }
  }, [issueId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await reload();
      if (!cancelled) timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      requestNumber.current++;
    };
  }, [reload]);

  const current = snapshot.issueId === issueId;
  return {
    data: current ? snapshot.data : EMPTY_DEVELOPMENT,
    isLoading: issueId !== null && (!current || !snapshot.loaded),
    loadError: current ? snapshot.error : null,
    reload,
  };
};
